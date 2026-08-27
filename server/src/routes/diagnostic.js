import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// ── Public: Cold-start quiz (5 questions, no auth) ──────────────
// Used before registration to deliver value first.
router.get('/cold-start', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT id, topic_tag, question_en, options_en, difficulty
      FROM questions
      WHERE is_mock_test_eligible = true
      ORDER BY RANDOM()
      LIMIT 5
    `);

    const questions = result.rows.map(q => ({
      id: q.id,
      topicTag: q.topic_tag,
      question: q.question_en,
      options: q.options_en,
      difficulty: q.difficulty,
    }));

    res.json({ questions });
  } catch (err) {
    next(err);
  }
});

// ── Public: Check answers (no auth) ─────────────────────────────
// Validates cold-start answers without revealing correct answers upfront.
router.post('/cold-start/check', async (req, res, next) => {
  try {
    const { answers } = req.body; // [{ questionId, selected }]
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const ids = answers.map(a => a.questionId);
    const result = await pool.query(
      `SELECT id, correct_answer, explanation_en, topic_tag FROM questions WHERE id = ANY($1::int[])`,
      [ids]
    );

    const checked = answers.map(a => {
      const q = result.rows.find(r => r.id === a.questionId);
      if (!q) return null;
      return {
        questionId: a.questionId,
        correct: a.selected === q.correct_answer,
        correctAnswer: q.correct_answer,
        explanation: q.explanation_en,
        topicTag: q.topic_tag,
      };
    }).filter(Boolean);

    const score = checked.filter(c => c.correct).length;
    const total = checked.length;

    res.json({ score, total, results: checked });
  } catch (err) {
    next(err);
  }
});

// ── Authenticated: Diagnostic (12 adaptive questions) ───────────
router.get('/diagnostic', authenticate, async (req, res, next) => {
  try {
    // Check if user already has mastery data
    const existing = await pool.query(
      `SELECT COUNT(*) as count FROM user_topic_mastery WHERE user_id = $1`,
      [req.user.id]
    );

    const alreadyCompleted = parseInt(existing.rows[0].count) > 0;

    // Get 12 questions across all topics, weighted toward variety
    const result = await pool.query(`
      SELECT q.id, q.topic_tag, q.question_en, q.options_en, q.difficulty, q.module_id
      FROM questions q
      WHERE q.is_mock_test_eligible = true
      ORDER BY RANDOM()
      LIMIT 12
    `);

    const questions = result.rows.map(q => ({
      id: q.id,
      topicTag: q.topic_tag,
      question: q.question_en,
      options: q.options_en,
      difficulty: q.difficulty,
      moduleId: q.module_id,
    }));

    res.json({ questions, alreadyCompleted });
  } catch (err) {
    next(err);
  }
});

// ── Authenticated: Submit diagnostic results ────────────────────
router.post('/diagnostic/submit', authenticate, async (req, res, next) => {
  try {
    const { answers } = req.body; // [{ questionId, selected, topicTag }]
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const ids = answers.map(a => a.questionId);
    const result = await pool.query(
      `SELECT id, correct_answer, topic_tag FROM questions WHERE id = ANY($1::int[])`,
      [ids]
    );

    // Calculate per-topic mastery
    const topicStats = {};
    for (const ans of answers) {
      const q = result.rows.find(r => r.id === ans.questionId);
      if (!q) continue;
      const tag = q.topic_tag;
      if (!topicStats[tag]) {
        topicStats[tag] = { answered: 0, correct: 0 };
      }
      topicStats[tag].answered++;
      if (ans.selected === q.correct_answer) {
        topicStats[tag].correct++;
      }
    }

    // Upsert mastery scores
    let overallMastery = 0;
    let topicCount = 0;
    for (const [tag, stats] of Object.entries(topicStats)) {
      const mastery = stats.answered > 0 ? stats.correct / stats.answered : 0;
      overallMastery += mastery;
      topicCount++;

      await pool.query(
        `INSERT INTO user_topic_mastery (user_id, topic_tag, mastery_score, questions_answered, questions_correct, last_updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (user_id, topic_tag) DO UPDATE
         SET mastery_score = $3, questions_answered = $4, questions_correct = $5, last_updated_at = NOW()`,
        [req.user.id, tag, mastery, stats.answered, stats.correct]
      );
    }

    const readinessScore = topicCount > 0 ? Math.round((overallMastery / topicCount) * 100) : 0;

    // Also record per-question strength
    for (const ans of answers) {
      const q = result.rows.find(r => r.id === ans.questionId);
      if (!q) continue;
      const correct = ans.selected === q.correct_answer ? 1 : 0;
      await pool.query(
        `INSERT INTO user_question_strength (user_id, question_id, strength, last_seen_at, times_seen, times_correct)
         VALUES ($1, $2, $3, NOW(), 1, $4)
         ON CONFLICT (user_id, question_id) DO UPDATE
         SET strength = $3, last_seen_at = NOW(), times_seen = user_question_strength.times_seen + 1, times_correct = user_question_strength.times_correct + $4`,
        [req.user.id, ans.questionId, correct, correct]
      );
    }

    res.json({
      readinessScore,
      topicMastery: Object.entries(topicStats).map(([tag, stats]) => ({
        topicTag: tag,
        mastery: stats.answered > 0 ? stats.correct / stats.answered : 0,
        answered: stats.answered,
        correct: stats.correct,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── Authenticated: Get readiness score ──────────────────────────
router.get('/readiness', authenticate, async (req, res, next) => {
  try {
    // Get all topic mastery for user
    const mastery = await pool.query(
      `SELECT topic_tag, mastery_score, questions_answered, questions_correct FROM user_topic_mastery WHERE user_id = $1`,
      [req.user.id]
    );

    if (mastery.rows.length === 0) {
      return res.json({ readinessScore: null, topicMastery: [], message: 'Diagnostic not yet completed' });
    }

    // Get topic weights from question frequency (how often each topic appears in the exam pool)
    const weights = await pool.query(`
      SELECT topic_tag, COUNT(*) as freq FROM questions WHERE is_mock_test_eligible = true GROUP BY topic_tag
    `);
    const totalQuestions = weights.rows.reduce((sum, r) => sum + parseInt(r.freq), 0);

    let weightedSum = 0;
    let weightTotal = 0;
    const topicMastery = mastery.rows.map(m => {
      const weight = weights.rows.find(w => w.topic_tag === m.topic_tag);
      const w = weight ? parseInt(weight.freq) / totalQuestions : 1 / mastery.rows.length;
      weightedSum += m.mastery_score * w;
      weightTotal += w;
      return {
        topicTag: m.topic_tag,
        mastery: m.mastery_score,
        answered: m.questions_answered,
        correct: m.questions_correct,
        weight: w,
      };
    });

    const readinessScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;

    res.json({ readinessScore, topicMastery });
  } catch (err) {
    next(err);
  }
});

export default router;
