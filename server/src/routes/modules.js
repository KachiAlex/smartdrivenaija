import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

function localizedField(field, lang) {
  if (lang && lang !== 'en') {
    return `COALESCE(${field}_${lang}, ${field}_en)`;
  }
  return `${field}_en`;
}

// GET /modules — list all modules with user progress
router.get('/', async (req, res, next) => {
  try {
    const lang = req.query.lang || 'en';
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT
        m.id, m.slug, m.icon, m.sort_order, m.is_free, m.is_premium,
        m.estimated_minutes, m.xp_reward,
        m.title_en, m.description_en,
        COALESCE(ump.status, CASE WHEN m.is_free THEN 'available'::module_status ELSE 'locked'::module_status END) as status,
        COALESCE(ump.progress_percent, 0) as progress_percent,
        COALESCE(ump.lessons_completed, 0) as lessons_completed,
        COALESCE(ump.total_lessons, 0) as total_lessons,
        (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count
      FROM modules m
      LEFT JOIN user_module_progress ump ON ump.module_id = m.id AND ump.user_id = $1
      ORDER BY m.sort_order
    `, [userId]);

    const user = await pool.query(`SELECT is_premium FROM users WHERE id = $1`, [userId]);
    const isPremium = user.rows[0]?.is_premium;

    const modules = result.rows.map(m => ({
      id: m.id,
      slug: m.slug,
      title: m.title_en,
      description: m.description_en,
      icon: m.icon,
      sortOrder: m.sort_order,
      isFree: m.is_free,
      isPremium: m.is_premium,
      estimatedMinutes: m.estimated_minutes,
      xpReward: m.xp_reward,
      status: m.status,
      isLocked: !m.is_free && !isPremium && m.is_premium,
      progressPercent: parseFloat(m.progress_percent),
      lessonsCompleted: m.lessons_completed,
      totalLessons: parseInt(m.lesson_count),
    }));

    res.json(modules);
  } catch (err) {
    next(err);
  }
});

// GET /modules/:id/content — full module content with lessons
router.get('/:id/content', async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.id);
    const userId = req.user.id;

    const modResult = await pool.query(`SELECT * FROM modules WHERE id = $1`, [moduleId]);
    if (modResult.rows.length === 0) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const mod = modResult.rows[0];

    // Check access
    const user = await pool.query(`SELECT is_premium FROM users WHERE id = $1`, [userId]);
    if (!mod.is_free && !user.rows[0]?.is_premium) {
      return res.status(403).json({ error: 'Premium access required', code: 'PREMIUM_REQUIRED' });
    }

    // Get lessons with user progress
    const lessons = await pool.query(`
      SELECT 
        l.id, l.slug, l.title_en, l.content_en, l.audio_url_en,
        l.sort_order, l.estimated_minutes, l.xp_reward,
        COALESCE(ulp.completed, false) as completed,
        COALESCE(ulp.time_spent_seconds, 0) as time_spent_seconds
      FROM lessons l
      LEFT JOIN user_lesson_progress ulp ON ulp.lesson_id = l.id AND ulp.user_id = $2
      WHERE l.module_id = $1
      ORDER BY l.sort_order
    `, [moduleId, userId]);

    // Get questions for this module
    const questions = await pool.query(
      `SELECT id, topic_tag, question_en, options_en, correct_answer, explanation_en, difficulty
       FROM questions WHERE module_id = $1 ORDER BY RANDOM()`,
      [moduleId]
    );

    res.json({
      module: {
        id: mod.id,
        slug: mod.slug,
        title: mod.title_en,
        description: mod.description_en,
        icon: mod.icon,
        xpReward: mod.xp_reward,
      },
      lessons: lessons.rows.map(l => ({
        id: l.id,
        slug: l.slug,
        title: l.title_en,
        content: l.content_en,
        audioUrl: l.audio_url_en,
        sortOrder: l.sort_order,
        estimatedMinutes: l.estimated_minutes,
        xpReward: l.xp_reward,
        completed: l.completed,
        timeSpentSeconds: l.time_spent_seconds,
      })),
      questions: questions.rows.map(q => ({
        id: q.id,
        topicTag: q.topic_tag,
        question: q.question_en,
        options: q.options_en,
        correctAnswer: q.correct_answer,
        explanation: q.explanation_en,
        difficulty: q.difficulty,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
