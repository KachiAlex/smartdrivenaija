import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// GET /progress — full user progress across all modules
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await pool.query(
      `SELECT xp_total, streak_current, streak_longest, streak_last_activity FROM users WHERE id = $1`,
      [userId]
    );

    const moduleProgress = await pool.query(`
      SELECT ump.*, m.title_en as module_title, m.slug as module_slug, m.xp_reward
      FROM user_module_progress ump
      JOIN modules m ON m.id = ump.module_id
      WHERE ump.user_id = $1
      ORDER BY m.sort_order
    `, [userId]);

    const recentQuizzes = await pool.query(`
      SELECT qa.*, m.title_en as module_title
      FROM quiz_attempts qa
      JOIN modules m ON m.id = qa.module_id
      WHERE qa.user_id = $1
      ORDER BY qa.completed_at DESC LIMIT 10
    `, [userId]);

    const recentMocks = await pool.query(`
      SELECT * FROM mock_tests WHERE user_id = $1 ORDER BY started_at DESC LIMIT 10`,
      [userId]
    );

    const badges = await pool.query(`
      SELECT b.slug, b.title_en, b.description_en, b.icon, b.xp_reward, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON b.id = ub.badge_id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
    `, [userId]);

    const xpHistory = await pool.query(`
      SELECT source, SUM(amount) as total, COUNT(*) as count
      FROM xp_ledger WHERE user_id = $1
      GROUP BY source
    `, [userId]);

    const u = user.rows[0];
    const totalModules = moduleProgress.rows.length;
    const completedModules = moduleProgress.rows.filter(m => m.status === 'completed').length;
    const overallPercent = totalModules > 0
      ? moduleProgress.rows.reduce((sum, m) => sum + parseFloat(m.progress_percent || 0), 0) / totalModules
      : 0;

    res.json({
      xpTotal: u.xp_total,
      streakCurrent: u.streak_current,
      streakLongest: u.streak_longest,
      streakLastActivity: u.streak_last_activity,
      overallPercent: Math.round(overallPercent),
      modulesCompleted: completedModules,
      totalModules,
      modules: moduleProgress.rows.map(m => ({
        moduleId: m.module_id,
        moduleSlug: m.module_slug,
        moduleTitle: m.module_title,
        status: m.status,
        progressPercent: parseFloat(m.progress_percent),
        lessonsCompleted: m.lessons_completed,
        totalLessons: m.total_lessons,
      })),
      recentQuizzes: recentQuizzes.rows.map(q => ({
        id: q.id,
        moduleTitle: q.module_title,
        score: q.score,
        totalQuestions: q.total_questions,
        percentage: parseFloat(q.percentage),
        passed: q.passed,
        xpEarned: q.xp_earned,
        completedAt: q.completed_at,
      })),
      recentMockTests: recentMocks.rows.map(m => ({
        id: m.id,
        score: m.score,
        totalQuestions: m.total_questions,
        percentage: m.percentage ? parseFloat(m.percentage) : null,
        passed: m.passed,
        timeTakenSeconds: m.time_taken_seconds,
        xpEarned: m.xp_earned,
        completedAt: m.completed_at,
      })),
      badges: badges.rows.map(b => ({
        slug: b.slug,
        title: b.title_en,
        description: b.description_en,
        icon: b.icon,
        xpReward: b.xp_reward,
        earnedAt: b.earned_at,
      })),
      xpBreakdown: xpHistory.rows.map(x => ({
        source: x.source,
        total: parseInt(x.total),
        count: parseInt(x.count),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /progress/lesson-complete
router.post('/lesson-complete', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { lessonId, timeSpentSeconds } = req.body;

    if (!lessonId) {
      return res.status(400).json({ error: 'lessonId required' });
    }

    // Get lesson info
    const lesson = await pool.query(
      `SELECT l.*, m.id as mod_id FROM lessons l JOIN modules m ON m.id = l.module_id WHERE l.id = $1`,
      [lessonId]
    );
    if (lesson.rows.length === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    const lessonData = lesson.rows[0];

    // Mark lesson complete
    await pool.query(`
      INSERT INTO user_lesson_progress (user_id, lesson_id, completed, time_spent_seconds, completed_at)
      VALUES ($1, $2, true, $3, NOW())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET completed = true, time_spent_seconds = user_lesson_progress.time_spent_seconds + EXCLUDED.time_spent_seconds, completed_at = NOW()
    `, [userId, lessonId, timeSpentSeconds || 0]);

    // Award XP
    const xpAmount = lessonData.xp_reward;
    await pool.query(
      `INSERT INTO xp_ledger (user_id, amount, source, description) VALUES ($1, $2, 'lesson', $3)`,
      [userId, xpAmount, `Completed: ${lessonData.title_en}`]
    );
    await pool.query(`UPDATE users SET xp_total = xp_total + $1 WHERE id = $2`, [xpAmount, userId]);

    // Update module progress
    const completedLessons = await pool.query(
      `SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = $1 AND lesson_id IN (SELECT id FROM lessons WHERE module_id = $2) AND completed = true`,
      [userId, lessonData.mod_id]
    );
    const totalLessons = await pool.query(
      `SELECT COUNT(*) as count FROM lessons WHERE module_id = $1`,
      [lessonData.mod_id]
    );

    const completed = parseInt(completedLessons.rows[0].count);
    const total = parseInt(totalLessons.rows[0].count);
    const percent = total > 0 ? (completed / total) * 100 : 0;
    const moduleStatus = percent >= 100 ? 'completed' : 'in_progress';

    await pool.query(`
      UPDATE user_module_progress
      SET lessons_completed = $3, progress_percent = $4, status = $5,
          started_at = COALESCE(started_at, NOW()),
          completed_at = CASE WHEN $5 = 'completed' THEN NOW() ELSE completed_at END
      WHERE user_id = $1 AND module_id = $2
    `, [userId, lessonData.mod_id, completed, percent, moduleStatus]);

    // Update streak
    await updateStreak(userId);

    // Log analytics event
    await pool.query(
      `INSERT INTO analytics_events (user_id, event_type, event_data)
       VALUES ($1, 'lesson_complete', $2)`,
      [userId, JSON.stringify({ lessonId, moduleId: lessonData.mod_id, timeSpentSeconds })]
    );

    res.json({
      xpEarned: xpAmount,
      lessonsCompleted: completed,
      totalLessons: total,
      progressPercent: Math.round(percent),
      moduleCompleted: moduleStatus === 'completed',
    });
  } catch (err) {
    next(err);
  }
});

async function updateStreak(userId) {
  const today = new Date().toISOString().split('T')[0];

  // Upsert today's streak record
  await pool.query(`
    INSERT INTO streak_history (user_id, activity_date, xp_earned, lessons_completed)
    VALUES ($1, $2, 0, 1)
    ON CONFLICT (user_id, activity_date)
    DO UPDATE SET lessons_completed = streak_history.lessons_completed + 1
  `, [userId, today]);

  // Calculate current streak
  const streakResult = await pool.query(`
    WITH dates AS (
      SELECT activity_date, 
             activity_date - (ROW_NUMBER() OVER (ORDER BY activity_date DESC))::int AS grp
      FROM streak_history
      WHERE user_id = $1
      ORDER BY activity_date DESC
    )
    SELECT COUNT(*) as streak
    FROM dates
    WHERE grp = (SELECT grp FROM dates LIMIT 1)
  `, [userId]);

  const streak = parseInt(streakResult.rows[0]?.streak || 0);

  await pool.query(`
    UPDATE users SET streak_current = $2, streak_last_activity = $3,
      streak_longest = GREATEST(streak_longest, $2)
    WHERE id = $1
  `, [userId, streak, today]);

  // Check streak badges
  const badgeSlugs = [];
  if (streak >= 7) badgeSlugs.push('streak_7');
  if (streak >= 30) badgeSlugs.push('streak_30');
  if (streak >= 90) badgeSlugs.push('streak_90');

  for (const slug of badgeSlugs) {
    const badge = await pool.query(`SELECT id FROM badges WHERE slug = $1`, [slug]);
    if (badge.rows[0]) {
      await pool.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, badge.rows[0].id]
      );
    }
  }
}

export { updateStreak };
export default router;
