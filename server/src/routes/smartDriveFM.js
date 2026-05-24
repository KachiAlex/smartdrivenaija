import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// GET /smartdrive-fm/content - Get published audio content (public endpoint)
router.get('/content', async (req, res, next) => {
  try {
    const { contentType, language, limit = 20 } = req.query;

    let query = `
      SELECT id, title, description, content_type, audio_url, duration_seconds, 
             topic_tag, language, published_at
      FROM audio_content
      WHERE is_published = TRUE
    `;
    const params = [];
    let paramCount = 0;

    if (contentType) {
      paramCount++;
      query += ` AND content_type = $${paramCount}`;
      params.push(contentType);
    }

    if (language) {
      paramCount++;
      query += ` AND language = $${paramCount}`;
      params.push(language);
    }

    query += ` ORDER BY published_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      content: result.rows.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        contentType: c.content_type,
        audioUrl: c.audio_url,
        durationSeconds: c.duration_seconds,
        topicTag: c.topic_tag,
        language: c.language,
        publishedAt: c.published_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /smartdrive-fm/progress - Get user's audio listening progress
router.get('/progress', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT uap.id, uap.progress_seconds, uap.is_completed, uap.last_played_at, uap.completed_at,
             ac.id as audio_id, ac.title, ac.content_type, ac.audio_url, ac.duration_seconds
      FROM user_audio_progress uap
      JOIN audio_content ac ON uap.audio_id = ac.id
      WHERE uap.user_id = $1
      ORDER BY uap.last_played_at DESC
    `, [userId]);

    res.json({
      progress: result.rows.map(p => ({
        id: p.id,
        audioId: p.audio_id,
        title: p.title,
        contentType: p.content_type,
        audioUrl: p.audio_url,
        durationSeconds: p.duration_seconds,
        progressSeconds: p.progress_seconds,
        isCompleted: p.is_completed,
        lastPlayedAt: p.last_played_at,
        completedAt: p.completed_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /smartdrive-fm/progress - Update listening progress
router.post('/progress', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { audioId, progressSeconds, isCompleted } = req.body;

    if (!audioId) {
      return res.status(400).json({ error: 'Audio ID is required' });
    }

    const result = await pool.query(
      `INSERT INTO user_audio_progress (user_id, audio_id, progress_seconds, is_completed, completed_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, audio_id)
       DO UPDATE SET 
         progress_seconds = EXCLUDED.progress_seconds,
         is_completed = COALESCE($4, user_audio_progress.is_completed),
         completed_at = CASE WHEN $4 = TRUE THEN NOW() ELSE user_audio_progress.completed_at END,
         last_played_at = NOW()
       RETURNING *`,
      [userId, audioId, progressSeconds, isCompleted, isCompleted ? new Date() : null]
    );

    res.json({
      progress: {
        id: result.rows[0].id,
        audioId: result.rows[0].audio_id,
        progressSeconds: result.rows[0].progress_seconds,
        isCompleted: result.rows[0].is_completed,
        lastPlayedAt: result.rows[0].last_played_at,
        completedAt: result.rows[0].completed_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /smartdrive-fm/daily-snippet - Get daily safety snippet
router.get('/daily-snippet', async (req, res, next) => {
  try {
    const language = req.query.language || 'en';

    const result = await pool.query(
      `SELECT id, title, description, audio_url, duration_seconds, topic_tag, published_at
       FROM audio_content
       WHERE content_type = 'safety_snippet' AND is_published = TRUE AND language = $1
       ORDER BY published_at DESC
       LIMIT 1`,
      [language]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No daily snippet available' });
    }

    res.json({
      snippet: {
        id: result.rows[0].id,
        title: result.rows[0].title,
        description: result.rows[0].description,
        audioUrl: result.rows[0].audio_url,
        durationSeconds: result.rows[0].duration_seconds,
        topicTag: result.rows[0].topic_tag,
        publishedAt: result.rows[0].published_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /smartdrive-fm/podcasts - Get podcast episodes
router.get('/podcasts', async (req, res, next) => {
  try {
    const { language, limit = 10 } = req.query;

    let query = `
      SELECT id, title, description, audio_url, duration_seconds, topic_tag, published_at
      FROM audio_content
      WHERE content_type = 'podcast' AND is_published = TRUE
    `;
    const params = [];
    let paramCount = 0;

    if (language) {
      paramCount++;
      query += ` AND language = $${paramCount}`;
      params.push(language);
    }

    query += ` ORDER BY published_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      podcasts: result.rows.map(p => ({
        id: p.id,
        title: p.title,
        description: p.description,
        audioUrl: p.audio_url,
        durationSeconds: p.duration_seconds,
        topicTag: p.topic_tag,
        publishedAt: p.published_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
