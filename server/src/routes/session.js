import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { updateStreak } from './progress.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// ── Spaced Repetition Logic ────────────────────────────────────
// Each item carries a strength value (0-1) that grows with correct
// recall and decays with time. Review is triggered when predicted
// recall drops below threshold. As test day approaches, the threshold
// rises, compressing the schedule into a final-week cram.

// Predicted recall = strength * exp(-decay * daysSinceLastSeen)
// Decay rate: 0.3 (moderate forgetting curve)
const DECAY_RATE = 0.3;

// Base threshold: 0.7 (review when predicted recall drops below 70%)
// As test day approaches, threshold rises toward 0.9
const BASE_THRESHOLD = 0.7;
const MAX_THRESHOLD = 0.9;

function daysBetween(dateA, dateB) {
  return (dateA - dateB) / (1000 * 60 * 60 * 24);
}

function getReviewThreshold(testDate) {
  if (!testDate) return BASE_THRESHOLD;
  const daysToTest = daysBetween(new Date(testDate), new Date());
  if (daysToTest <= 0) return MAX_THRESHOLD;
  if (daysToTest >= 30) return BASE_THRESHOLD;
  // Linear interpolation: 30 days → 0.7, 0 days → 0.9
  return BASE_THRESHOLD + (MAX_THRESHOLD - BASE_THRESHOLD) * (1 - daysToTest / 30);
}

function getPredictedRecall(strength, lastSeenAt) {
  const daysSince = daysBetween(new Date(), new Date(lastSeenAt));
  return strength * Math.exp(-DECAY_RATE * Math.max(0, daysSince));
}

// ── GET /session/today — get today's daily session ─────────────
// Returns the four-movement session structure:
// 1. Warm-up: spaced-repetition items due today (3 items)
// 2. New ground: next lessons on the path (5-7 items)
// 3. The clip: hazard perception placeholder (1 item)
// 4. Close: readiness delta + streak info
router.get('/today', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user's test date for threshold calculation
    const userResult = await pool.query(
      `SELECT test_date FROM users WHERE id = $1`,
      [userId]
    );
    const testDate = userResult.rows[0]?.test_date;
    const threshold = getReviewThreshold(testDate);

    // ── Movement 1: Warm-up (spaced repetition items due) ──────
    // Find items where predicted recall has dropped below threshold
    const dueItems = await pool.query(`
      SELECT uqs.question_id, uqs.strength, uqs.last_seen_at, uqs.times_seen, uqs.times_correct,
             q.topic_tag, q.question_en, q.options_en, q.correct_answer, q.difficulty,
             q.explanation_en, q.module_id
      FROM user_question_strength uqs
      JOIN questions q ON q.id = uqs.question_id
      WHERE uqs.user_id = $1
        AND uqs.strength > 0
      ORDER BY uqs.last_seen_at ASC
      LIMIT 20
    `, [userId]);

    const dueForReview = dueItems.rows.filter(r => {
      const predicted = getPredictedRecall(r.strength, r.last_seen_at);
      return predicted < threshold;
    }).slice(0, 3);

    const warmup = dueForReview.map(r => ({
      id: r.question_id,
      topicTag: r.topic_tag,
      question: r.question_en,
      options: r.options_en,
      answer: r.correct_answer,
      difficulty: r.difficulty,
      explanation: r.explanation_en,
      moduleId: r.module_id,
      isReview: true,
      strength: r.strength,
      predictedRecall: getPredictedRecall(r.strength, r.last_seen_at),
    }));

    // ── Movement 2: New ground (next lessons on path) ──────────
    // Find the first module with incomplete lessons
    const nextModule = await pool.query(`
      SELECT m.id, m.slug, m.title_en, m.icon, m.sort_order, m.estimated_minutes, m.xp_reward
      FROM modules m
      LEFT JOIN user_module_progress ump ON ump.module_id = m.id AND ump.user_id = $1
      WHERE COALESCE(ump.status, CASE WHEN m.is_free THEN 'available' ELSE 'locked' END) != 'completed'
        AND (m.is_free = true OR u.is_premium = true)
      ORDER BY m.sort_order
      LIMIT 1
    `, [userId]);

    let newGround = null;
    if (nextModule.rows[0]) {
      const mod = nextModule.rows[0];
      const lessons = await pool.query(`
        SELECT l.id, l.title_en, l.content_en, l.estimated_minutes, l.xp_reward,
               COALESCE(ulp.completed, false) as completed
        FROM lessons l
        LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = l.id AND ulp.user_id = $1
        WHERE l.module_id = $2
        ORDER BY l.sort_order
      `, [userId, mod.id]);

      const nextLessons = lessons.rows.filter(l => !l.completed).slice(0, 5);

      // Get questions for those lessons' module
      const moduleQuestions = await pool.query(`
        SELECT id, topic_tag, question_en, options_en, correct_answer, difficulty, explanation_en, module_id
        FROM questions
        WHERE module_id = $1 AND is_mock_test_eligible = true
        ORDER BY RANDOM()
        LIMIT 7
      `, [mod.id]);

      newGround = {
        module: {
          id: mod.id,
          slug: mod.slug,
          title: mod.title_en,
          icon: mod.icon,
          estimatedMinutes: mod.estimated_minutes,
          xpReward: mod.xp_reward,
        },
        lessons: nextLessons.map(l => ({
          id: l.id,
          title: l.title_en,
          content: l.content_en,
          estimatedMinutes: l.estimated_minutes,
          xpReward: l.xp_reward,
        })),
        questions: moduleQuestions.rows.map(q => ({
          id: q.id,
          topicTag: q.topic_tag,
          question: q.question_en,
          options: q.options_en,
          answer: q.correct_answer,
          difficulty: q.difficulty,
          explanation: q.explanation_en,
          moduleId: q.module_id,
          isReview: false,
        })),
      };
    }

    // ── Movement 3: The clip (hazard perception placeholder) ───
    // For V1, this is a placeholder. V2 will have real video clips.
    const clip = {
      type: 'placeholder',
      title: 'Hazard Perception — Coming Soon',
      description: 'Nigerian road hazard video clips are being recorded. You will spot hazards in real footage from Lagos, Abuja, and Port Harcourt roads.',
      available: false,
    };

    // ── Movement 4: Close (readiness + streak) ─────────────────
    const readiness = await pool.query(
      `SELECT topic_tag, mastery_score, questions_answered, questions_correct
       FROM user_topic_mastery WHERE user_id = $1`,
      [userId]
    );

    let readinessScore = null;
    if (readiness.rows.length > 0) {
      const weights = await pool.query(`
        SELECT topic_tag, COUNT(*) as freq FROM questions WHERE is_mock_test_eligible = true GROUP BY topic_tag
      `);
      const totalQ = weights.rows.reduce((s, r) => s + parseInt(r.freq), 0);
      let weightedSum = 0, weightTotal = 0;
      for (const m of readiness.rows) {
        const w = weights.rows.find(w => w.topic_tag === m.topic_tag);
        const weight = w ? parseInt(w.freq) / totalQ : 1 / readiness.rows.length;
        weightedSum += m.mastery_score * weight;
        weightTotal += weight;
      }
      readinessScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;
    }

    const streakResult = await pool.query(
      `SELECT streak_current, streak_longest, xp_total FROM users WHERE id = $1`,
      [userId]
    );

    // Check if session already completed today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const sessionToday = await pool.query(
      `SELECT COUNT(*) as count FROM analytics_events
       WHERE user_id = $1 AND event_type = 'session_complete' AND created_at >= $2`,
      [userId, todayStart]
    );
    const alreadyCompletedToday = parseInt(sessionToday.rows[0].count) > 0;

    res.json({
      warmup,
      newGround,
      clip,
      close: {
        readinessScore,
        streakCurrent: streakResult.rows[0]?.streak_current || 0,
        xpTotal: streakResult.rows[0]?.xp_total || 0,
      },
      alreadyCompletedToday,
      reviewThreshold: threshold,
      daysToTest: testDate ? Math.ceil(daysBetween(new Date(testDate), new Date())) : null,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /session/warmup/submit — submit warm-up answers ───────
router.post('/warmup/submit', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { answers } = req.body; // [{ questionId, selected, timeMs }]

    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'answers array is required' });
    }

    const ids = answers.map(a => a.questionId);
    const questions = await pool.query(
      `SELECT id, correct_answer, topic_tag FROM questions WHERE id = ANY($1::int[])`,
      [ids]
    );

    let correctCount = 0;
    for (const ans of answers) {
      const q = questions.rows.find(r => r.id === ans.questionId);
      if (!q) continue;
      const correct = ans.selected === q.correct_answer;
      if (correct) correctCount++;

      // Update per-question strength
      // New strength = weighted average of old strength and recent performance
      const existing = await pool.query(
        `SELECT strength, times_seen, times_correct FROM user_question_strength WHERE user_id = $1 AND question_id = $2`,
        [userId, ans.questionId]
      );

      if (existing.rows[0]) {
        const old = existing.rows[0];
        const newStrength = correct
          ? Math.min(1, old.strength * 0.6 + 1 * 0.4)  // boost on correct
          : Math.max(0, old.strength * 0.3);             // sharp drop on incorrect
        await pool.query(
          `UPDATE user_question_strength
           SET strength = $3, last_seen_at = NOW(),
               times_seen = times_seen + 1, times_correct = times_correct + $4
           WHERE user_id = $1 AND question_id = $2`,
          [userId, ans.questionId, newStrength, correct ? 1 : 0]
        );

        // Update topic mastery
        await pool.query(
          `UPDATE user_topic_mastery
           SET questions_answered = questions_answered + 1,
               questions_correct = questions_correct + $3,
               mastery_score = (questions_correct + $3)::REAL / (questions_answered + 1),
               last_updated_at = NOW()
           WHERE user_id = $1 AND topic_tag = $2`,
          [userId, q.topic_tag, correct ? 1 : 0]
        );
      }
    }

    res.json({
      score: correctCount,
      total: answers.length,
      percentage: Math.round((correctCount / answers.length) * 100),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /session/complete — mark session as complete ──────────
router.post('/complete', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { warmupScore, warmupTotal, newGroundCompleted, durationSeconds } = req.body;

    // Log session completion
    await pool.query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'session_complete', $2)`,
      [userId, JSON.stringify({
        warmupScore, warmupTotal, newGroundCompleted, durationSeconds,
        completedAt: new Date().toISOString(),
      })]
    );

    // Update streak
    await updateStreak(userId);

    // Get updated readiness
    const readiness = await pool.query(
      `SELECT topic_tag, mastery_score, questions_answered, questions_correct
       FROM user_topic_mastery WHERE user_id = $1`,
      [userId]
    );

    let readinessScore = null;
    if (readiness.rows.length > 0) {
      const weights = await pool.query(`
        SELECT topic_tag, COUNT(*) as freq FROM questions WHERE is_mock_test_eligible = true GROUP BY topic_tag
      `);
      const totalQ = weights.rows.reduce((s, r) => s + parseInt(r.freq), 0);
      let weightedSum = 0, weightTotal = 0;
      for (const m of readiness.rows) {
        const w = weights.rows.find(w => w.topic_tag === m.topic_tag);
        const weight = w ? parseInt(w.freq) / totalQ : 1 / readiness.rows.length;
        weightedSum += m.mastery_score * weight;
        weightTotal += weight;
      }
      readinessScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;
    }

    const user = await pool.query(
      `SELECT streak_current, xp_total FROM users WHERE id = $1`,
      [userId]
    );

    res.json({
      readinessScore,
      streakCurrent: user.rows[0]?.streak_current || 0,
      xpTotal: user.rows[0]?.xp_total || 0,
      message: 'Session complete! See you tomorrow.',
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /session/test-outcome — record real test result ───────
// This is the highest-value data: self-reported pass/fail
router.post('/test-outcome', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { outcome } = req.body; // 'passed' | 'failed'

    if (!['passed', 'failed'].includes(outcome)) {
      return res.status(400).json({ error: 'outcome must be "passed" or "failed"' });
    }

    await pool.query(
      `UPDATE users SET test_outcome = $2 WHERE id = $1`,
      [userId, outcome]
    );

    // Log analytics
    await pool.query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'test_outcome', $2)`,
      [userId, JSON.stringify({ outcome, reportedAt: new Date().toISOString() })]
    );

    if (outcome === 'failed') {
      // Generate targeted retake plan from weak topics
      const weakTopics = await pool.query(
        `SELECT topic_tag, mastery_score, questions_answered, questions_correct
         FROM user_topic_mastery
         WHERE user_id = $1 AND mastery_score < 0.7
         ORDER BY mastery_score ASC
         LIMIT 5`,
        [userId]
      );

      const retakePlan = weakTopics.rows.map(t => ({
        topicTag: t.topic_tag,
        mastery: t.mastery_score,
        questionsToFocus: Math.max(5, Math.ceil((0.7 - t.mastery_score) * 20)),
      }));

      res.json({
        outcome,
        retakePlan,
        message: 'We have built a targeted plan from your weakest topics. Start tomorrow.',
      });
    } else {
      res.json({
        outcome,
        message: 'Congratulations! Your licence journey continues here.',
        nextSteps: 'post_licence',
      });
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /session/test-outcome/prompt — check if we should prompt ─
router.get('/test-outcome/prompt', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await pool.query(
      `SELECT test_date, test_outcome FROM users WHERE id = $1`,
      [userId]
    );

    const testDate = user.rows[0]?.test_date;
    const testOutcome = user.rows[0]?.test_outcome;

    if (!testDate) {
      return res.json({ shouldPrompt: false });
    }

    // Prompt if test date has passed and no outcome recorded
    const daysSinceTest = daysBetween(new Date(), new Date(testDate));
    const shouldPrompt = daysSinceTest >= 0 && !testOutcome;

    res.json({
      shouldPrompt,
      testDate,
      testOutcome,
      daysSinceTest: Math.floor(daysSinceTest),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
