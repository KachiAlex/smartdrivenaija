import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// ── GET /schedule — generate study plan from test date ─────────
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query(
      `SELECT test_date, test_outcome, streak_current, xp_total FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];
    const testDate = user?.test_date;

    if (!testDate) {
      return res.json({
        hasSchedule: false,
        message: 'No test date set. Set your test date to get a personalised schedule.',
      });
    }

    const now = new Date();
    const test = new Date(testDate);
    const daysToTest = Math.ceil((test - now) / (1000 * 60 * 60 * 24));

    if (daysToTest <= 0) {
      return res.json({
        hasSchedule: false,
        daysToTest: 0,
        message: user?.test_outcome
          ? `Your test outcome: ${user.test_outcome}.`
          : 'Your test date has passed. Report your result to get next steps.',
      });
    }

    // Get readiness
    const mastery = await pool.query(
      `SELECT topic_tag, mastery_score, questions_answered, questions_correct
       FROM user_topic_mastery WHERE user_id = $1`,
      [userId]
    );

    let readinessScore = null;
    const topicMastery = mastery.rows.map(m => ({
      topicTag: m.topic_tag,
      mastery: m.mastery_score,
      answered: m.questions_answered,
      correct: m.questions_correct,
    }));

    if (mastery.rows.length > 0) {
      const weights = await pool.query(
        `SELECT topic_tag, COUNT(*) as freq FROM questions WHERE is_mock_test_eligible = true GROUP BY topic_tag`
      );
      const totalQ = weights.rows.reduce((s, r) => s + parseInt(r.freq), 0);
      let weightedSum = 0, weightTotal = 0;
      for (const m of mastery.rows) {
        const w = weights.rows.find(w => w.topic_tag === m.topic_tag);
        const weight = w ? parseInt(w.freq) / totalQ : 1 / mastery.rows.length;
        weightedSum += m.mastery_score * weight;
        weightTotal += weight;
      }
      readinessScore = weightTotal > 0 ? Math.round((weightedSum / weightTotal) * 100) : 0;
    }

    // ── Build the schedule ──────────────────────────────────────
    // Total sessions available = days to test (one session per day)
    // But cap at reasonable number for display
    const totalSessions = Math.min(daysToTest, 60);
    const sessionsPerWeek = Math.min(7, Math.max(4, Math.ceil(totalSessions / Math.max(1, Math.ceil(daysToTest / 7)))));

    // Phase calculation
    let phase;
    if (daysToTest > 21) {
      phase = 'foundation';
    } else if (daysToTest > 7) {
      phase = 'intensive';
    } else {
      phase = 'cram';
    }

    // Target readiness by phase
    const targetReadiness = phase === 'cram' ? 85 : phase === 'intensive' ? 75 : 65;
    const readinessGap = readinessScore !== null ? Math.max(0, targetReadiness - readinessScore) : targetReadiness;

    // Sessions needed to close the gap (rough estimate: ~2% per session)
    const sessionsToTarget = Math.ceil(readinessGap / 2);

    // Weak topics to prioritise
    const weakTopics = topicMastery
      .filter(t => t.mastery < 0.7)
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3)
      .map(t => ({
        topicTag: t.topic_tag,
        mastery: Math.round(t.mastery * 100),
        priority: 'high',
      }));

    const mediumTopics = topicMastery
      .filter(t => t.mastery >= 0.7 && t.mastery < 0.85)
      .sort((a, b) => a.mastery - b.mastery)
      .map(t => ({
        topicTag: t.topic_tag,
        mastery: Math.round(t.mastery * 100),
        priority: 'medium',
      }));

    // ── Notification cadence ────────────────────────────────────
    let notificationCadence;
    if (phase === 'foundation') {
      notificationCadence = {
        frequency: 'daily',
        time: '08:00',
        tone: 'encouraging',
        message: 'Your daily session is ready. 7 minutes to stay on track.',
      };
    } else if (phase === 'intensive') {
      notificationCadence = {
        frequency: 'daily',
        time: '07:30',
        tone: 'urgent',
        message: `${daysToTest} days to your test. Every session counts now.`,
      };
    } else {
      notificationCadence = {
        frequency: 'twice_daily',
        times: ['07:00', '18:00'],
        tone: 'critical',
        message: `${daysToTest} days left. Do not skip your session today.`,
      };
    }

    // ── Weekly milestones ───────────────────────────────────────
    const weeks = Math.ceil(daysToTest / 7);
    const milestones = [];
    for (let w = 1; w <= Math.min(weeks, 8); w++) {
      const weekStart = w === 1 ? 0 : (w - 1) * 7;
      const weekEnd = w * 7;
      const daysIntoWeek = Math.max(0, daysToTest - weekStart);
      const targetByWeek = Math.min(targetReadiness, Math.round((readinessScore || 0) + (readinessGap * w / weeks)));

      milestones.push({
        week: w,
        daysRemaining: Math.max(0, daysToTest - weekEnd),
        targetReadiness: targetByWeek,
        focus: w <= weeks * 0.4 ? 'new_content' : w <= weeks * 0.7 ? 'weak_topics' : 'mock_tests',
      });
    }

    // ── Daily plan for today ────────────────────────────────────
    const todayPlan = {
      day: 1,
      phase,
      sessionAvailable: true,
      focus: phase === 'cram' ? 'review_weak_topics' : phase === 'intensive' ? 'mixed' : 'new_content',
      weakTopics: weakTopics.map(t => t.topicTag),
      estimatedDuration: phase === 'cram' ? 10 : 7,
    };

    res.json({
      hasSchedule: true,
      testDate: testDate,
      daysToTest,
      phase,
      readinessScore,
      targetReadiness,
      readinessGap,
      sessionsToTarget,
      totalSessions,
      sessionsPerWeek,
      weakTopics,
      mediumTopics,
      notificationCadence,
      milestones,
      todayPlan,
      streakCurrent: user?.streak_current || 0,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /schedule/notifications — get notification settings ─────
router.get('/notifications', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query(
      `SELECT test_date, phone, email, notification_preferences FROM users WHERE id = $1`,
      [userId]
    );
    const user = userResult.rows[0];

    if (!user?.test_date) {
      return res.json({
        enabled: false,
        message: 'Set your test date to enable smart notifications.',
      });
    }

    const daysToTest = Math.ceil((new Date(user.test_date) - new Date()) / (1000 * 60 * 60 * 24));
    const prefs = user.notification_preferences || {};

    let cadence;
    if (daysToTest > 21) {
      cadence = { frequency: 'daily', time: '08:00', label: 'Daily reminder' };
    } else if (daysToTest > 7) {
      cadence = { frequency: 'daily', time: '07:30', label: 'Daily reminder (intensive)' };
    } else if (daysToTest > 0) {
      cadence = { frequency: 'twice_daily', times: ['07:00', '18:00'], label: 'Twice daily (final stretch)' };
    } else {
      cadence = { frequency: 'none', label: 'Test date passed' };
    }

    res.json({
      enabled: prefs.enabled !== false,
      cadence,
      channels: {
        sms: !!user.phone,
        email: !!user.email,
        push: prefs.push !== false,
      },
      daysToTest,
      nextReminder: cadence.frequency !== 'none' ? {
        type: 'session_reminder',
        scheduledFor: 'tomorrow ' + (cadence.time || cadence.times?.[0] || '08:00'),
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /schedule/notifications — update notification prefs ─────
router.put('/notifications', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enabled, push, sms, email } = req.body;

    const current = await pool.query(
      `SELECT notification_preferences FROM users WHERE id = $1`,
      [userId]
    );

    const prefs = current.rows[0]?.notification_preferences || {};
    if (enabled !== undefined) prefs.enabled = enabled;
    if (push !== undefined) prefs.push = push;
    if (sms !== undefined) prefs.sms = sms;
    if (email !== undefined) prefs.email = email;

    await pool.query(
      `UPDATE users SET notification_preferences = $2 WHERE id = $1`,
      [userId, JSON.stringify(prefs)]
    );

    res.json({ message: 'Notification preferences updated', preferences: prefs });
  } catch (err) {
    next(err);
  }
});

export default router;
