import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// GET /user/profile
router.get('/profile', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = result.rows[0];
    res.json({
      id: u.id,
      phone: u.phone,
      fullName: u.full_name,
      role: u.role,
      preferredLanguage: u.preferred_language,
      isPremium: u.is_premium,
      xpTotal: u.xp_total,
      streakCurrent: u.streak_current,
      streakLongest: u.streak_longest,
      onboardingCompleted: u.onboarding_completed,
      createdAt: u.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /user/profile
router.put('/profile', async (req, res, next) => {
  try {
    const { fullName, preferredLanguage } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(fullName);
    }
    if (preferredLanguage !== undefined) {
      updates.push(`preferred_language = $${idx++}`);
      values.push(preferredLanguage);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const u = result.rows[0];
    res.json({
      id: u.id,
      phone: u.phone,
      fullName: u.full_name,
      role: u.role,
      preferredLanguage: u.preferred_language,
      isPremium: u.is_premium,
      xpTotal: u.xp_total,
      streakCurrent: u.streak_current,
      streakLongest: u.streak_longest,
      onboardingCompleted: u.onboarding_completed,
    });
  } catch (err) {
    next(err);
  }
});

// POST /user/onboarding-complete
router.post('/onboarding-complete', async (req, res, next) => {
  try {
    const { fullName, preferredLanguage } = req.body;
    await pool.query(
      `UPDATE users SET onboarding_completed = true, full_name = COALESCE($2, full_name), preferred_language = COALESCE($3, preferred_language) WHERE id = $1`,
      [req.user.id, fullName || null, preferredLanguage || null]
    );

    // Initialize module progress for this user
    const modules = await pool.query(`SELECT id, is_free FROM modules ORDER BY sort_order`);
    for (const mod of modules.rows) {
      const lessonCount = await pool.query(
        `SELECT COUNT(*) as count FROM lessons WHERE module_id = $1`, [mod.id]
      );
      await pool.query(
        `INSERT INTO user_module_progress (user_id, module_id, status, total_lessons)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, module_id) DO NOTHING`,
        [req.user.id, mod.id, mod.is_free ? 'available' : 'locked', parseInt(lessonCount.rows[0].count)]
      );
    }

    res.json({ message: 'Onboarding completed' });
  } catch (err) {
    next(err);
  }
});

export default router;
