import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { updateStreak } from './progress.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// POST /mock-test/start — generate a new 40-question mock test
router.post('/start', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const questionCount = parseInt(req.query.count) || 40;

    // Get random questions across all modules (mock-test eligible)
    const questions = await pool.query(`
      SELECT id, module_id, topic_tag, question_en as question, options_en as options, difficulty
      FROM questions
      WHERE is_mock_test_eligible = true
      ORDER BY RANDOM()
      LIMIT $1
    `, [questionCount]);

    if (questions.rows.length === 0) {
      return res.status(400).json({ error: 'No questions available' });
    }

    const questionIds = questions.rows.map(q => q.id);

    // Create mock test record
    const test = await pool.query(`
      INSERT INTO mock_tests (user_id, questions, total_questions, time_limit_seconds)
      VALUES ($1, $2, $3, 1800)
      RETURNING id, started_at, time_limit_seconds
    `, [userId, JSON.stringify(questionIds), questions.rows.length]);

    res.json({
      testId: test.rows[0].id,
      startedAt: test.rows[0].started_at,
      timeLimitSeconds: test.rows[0].time_limit_seconds,
      totalQuestions: questions.rows.length,
      questions: questions.rows.map(q => ({
        id: q.id,
        topicTag: q.topic_tag,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /mock-test/:id/submit
router.post('/:id/submit', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const testId = req.params.id;
    const { answers, timeTakenSeconds } = req.body;
    // answers: [{questionId, selected}]

    // Verify test belongs to user and is not already submitted
    const testResult = await pool.query(
      `SELECT * FROM mock_tests WHERE id = $1 AND user_id = $2`, [testId, userId]
    );
    if (testResult.rows.length === 0) {
      return res.status(404).json({ error: 'Mock test not found' });
    }
    if (testResult.rows[0].completed_at) {
      return res.status(400).json({ error: 'Mock test already submitted' });
    }

    // Fetch correct answers
    const questionIds = answers.map(a => a.questionId);
    const questionsResult = await pool.query(
      `SELECT id, correct_answer, topic_tag, explanation_en FROM questions WHERE id = ANY($1)`,
      [questionIds]
    );

    const questionMap = {};
    for (const q of questionsResult.rows) {
      questionMap[q.id] = q;
    }

    // Score
    let score = 0;
    const topicScores = {};
    const gradedAnswers = answers.map(a => {
      const q = questionMap[a.questionId];
      const correct = q ? a.selected === q.correct_answer : false;
      if (correct) score++;

      const tag = q?.topic_tag || 'unknown';
      if (!topicScores[tag]) topicScores[tag] = { correct: 0, total: 0 };
      topicScores[tag].total++;
      if (correct) topicScores[tag].correct++;

      return {
        question_id: a.questionId,
        selected: a.selected,
        correct,
        topic_tag: tag,
        time_ms: a.timeMs || 0,
        explanation: q?.explanation_en,
      };
    });

    const totalQuestions = testResult.rows[0].total_questions;
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= 70;
    const xpEarned = passed ? 1000 : Math.round(score * 10);

    // Update mock test record
    await pool.query(`
      UPDATE mock_tests
      SET answers = $1, score = $2, percentage = $3, passed = $4,
          time_taken_seconds = $5, xp_earned = $6, completed_at = NOW()
      WHERE id = $7
    `, [JSON.stringify(gradedAnswers), score, percentage, passed, timeTakenSeconds, xpEarned, testId]);

    // Award XP
    await pool.query(
      `INSERT INTO xp_ledger (user_id, amount, source, reference_id, description)
       VALUES ($1, $2, 'mock_test', $3, $4)`,
      [userId, xpEarned, testId, `Mock Test: ${score}/${totalQuestions} (${Math.round(percentage)}%)`]
    );
    await pool.query(`UPDATE users SET xp_total = xp_total + $1 WHERE id = $2`, [xpEarned, userId]);

    // Update streak
    await updateStreak(userId);

    // Log analytics
    for (const a of gradedAnswers) {
      await pool.query(
        `INSERT INTO analytics_events (user_id, event_type, event_data)
         VALUES ($1, 'quiz_answer', $2)`,
        [userId, JSON.stringify({
          questionId: a.question_id,
          topicTag: a.topic_tag,
          selected: a.selected,
          correct: a.correct,
          timeMs: a.time_ms,
          source: 'mock_test',
          mockTestId: testId,
        })]
      );
    }

    // Check badges
    const mockCount = await pool.query(
      `SELECT COUNT(*) as count FROM mock_tests WHERE user_id = $1 AND completed_at IS NOT NULL`, [userId]
    );
    if (parseInt(mockCount.rows[0].count) === 1) {
      const badge = await pool.query(`SELECT id FROM badges WHERE slug = 'first_mock'`);
      if (badge.rows[0]) {
        await pool.query(
          `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, badge.rows[0].id]
        );
      }
    }

    // Speed demon badge
    if (timeTakenSeconds && timeTakenSeconds < 900) { // under 15 minutes
      const badge = await pool.query(`SELECT id FROM badges WHERE slug = 'speed_demon'`);
      if (badge.rows[0]) {
        await pool.query(
          `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [userId, badge.rows[0].id]
        );
      }
    }

    // Topic performance breakdown
    const topicPerformance = Object.entries(topicScores).map(([topic, data]) => ({
      topic,
      correct: data.correct,
      total: data.total,
      percentage: Math.round((data.correct / data.total) * 100),
    })).sort((a, b) => a.percentage - b.percentage);

    // Weak areas (below 70%)
    const weakAreas = topicPerformance.filter(t => t.percentage < 70);

    res.json({
      testId,
      score,
      totalQuestions,
      percentage: Math.round(percentage),
      passed,
      xpEarned,
      timeTakenSeconds,
      topicPerformance,
      weakAreas,
      answers: gradedAnswers,
    });
  } catch (err) {
    next(err);
  }
});

// GET /mock-test/history — recent mock test results
router.get('/history', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const tests = await pool.query(`
      SELECT id, score, total_questions, percentage, passed, time_taken_seconds, xp_earned, started_at, completed_at
      FROM mock_tests
      WHERE user_id = $1 AND completed_at IS NOT NULL
      ORDER BY completed_at DESC
      LIMIT $2
    `, [userId, limit]);

    res.json(tests.rows.map(t => ({
      id: t.id,
      score: t.score,
      totalQuestions: t.total_questions,
      percentage: t.percentage ? parseFloat(t.percentage) : null,
      passed: t.passed,
      timeTakenSeconds: t.time_taken_seconds,
      xpEarned: t.xp_earned,
      startedAt: t.started_at,
      completedAt: t.completed_at,
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
