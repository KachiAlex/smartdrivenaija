import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import pool from '../db/pool.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Auth helpers ─────────────────────────────────────────────────────────────

const adminAuth = [authenticate, requireRole('admin')];

// ── POST /admin/login ─────────────────────────────────────────────────────────

router.post('/login', async (req, res, next) => {
  try {
    // Validate required environment variables
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error: JWT_SECRET not set' });
    }

    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1 AND role = 'admin'`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    if (!user.password_hash) return res.status(401).json({ error: 'Password not set for this account' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role },
    });
  } catch (err) {
    console.error('Admin login error:', err);
    next(err);
  }
});

// ── POST /admin/setup ─────────────────────────────────────────────────────────
// One-time endpoint to create the first admin account (requires ADMIN_SECRET)

router.post('/setup', async (req, res, next) => {
  try {
    const { secret, email, password, fullName } = req.body;

    if (!secret || secret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Invalid admin secret' });
    }

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password, and fullName required' });
    }

    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, password_set_at)
       VALUES ($1, $2, $3, 'admin', NOW()) RETURNING id, email, full_name, role`,
      [email, passwordHash, fullName]
    );

    res.status(201).json({ message: 'Admin account created', user: result.rows[0] });
  } catch (err) { next(err); }
});

// ── GET /admin/stats ──────────────────────────────────────────────────────────

router.get('/stats', ...adminAuth, async (req, res, next) => {
  try {
    const [users, premiumUsers, newToday, otpCodes, activeTokens] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role NOT IN ('admin', 'school_admin', 'frsc_admin')`),
      pool.query(`SELECT COUNT(*) FROM users WHERE is_premium = true`),
      pool.query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours' AND role NOT IN ('admin', 'school_admin', 'frsc_admin')`),
      pool.query(`SELECT COUNT(*) FROM otp_codes WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*) FROM refresh_tokens WHERE revoked = false AND expires_at > NOW()`),
    ]);

    const roleBreakdown = await pool.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`
    );

    const signupsLast7Days = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days' AND role NOT IN ('admin', 'school_admin', 'frsc_admin')
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      premiumUsers: parseInt(premiumUsers.rows[0].count),
      newToday: parseInt(newToday.rows[0].count),
      otpRequestsToday: parseInt(otpCodes.rows[0].count),
      activeRefreshTokens: parseInt(activeTokens.rows[0].count),
      roleBreakdown: roleBreakdown.rows,
      signupsLast7Days: signupsLast7Days.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err) { next(err); }
});

// ── GET /admin/users ──────────────────────────────────────────────────────────

router.get('/users', ...adminAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const offset = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const role = req.query.role || '';

    let where = `WHERE u.role != 'admin'`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      where += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
    }

    if (role) {
      params.push(role);
      where += ` AND u.role = $${params.length}`;
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM users u ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    params.push(limit, offset);
    const usersResult = await pool.query(`
      SELECT u.id, u.phone, u.email, u.full_name, u.role, u.is_premium,
             u.xp_total, u.streak_current, u.onboarding_completed,
             u.created_at, u.updated_at,
             (u.password_hash IS NOT NULL) as has_password
      FROM users u
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({
      users: usersResult.rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) { next(err); }
});

// ── GET /admin/users/:id ──────────────────────────────────────────────────────

router.get('/users/:id', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.phone, u.email, u.full_name, u.role, u.is_premium,
             u.premium_expires_at, u.xp_total, u.streak_current, u.streak_longest,
             u.onboarding_completed, u.preferred_language, u.created_at, u.updated_at,
             (u.password_hash IS NOT NULL) as has_password,
             (SELECT COUNT(*) FROM refresh_tokens rt WHERE rt.user_id = u.id AND rt.revoked = false AND rt.expires_at > NOW()) as active_sessions
      FROM users u WHERE u.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /admin/users/:id ────────────────────────────────────────────────────

router.patch('/users/:id', ...adminAuth, async (req, res, next) => {
  try {
    const { role, isPremium, premiumExpiresAt } = req.body;
    const allowed = ['learner', 'instructor', 'school_admin', 'frsc_admin'];

    const sets = [];
    const params = [];

    if (role !== undefined) {
      if (!allowed.includes(role)) return res.status(400).json({ error: 'Invalid role' });
      params.push(role); sets.push(`role = $${params.length}`);
    }
    if (isPremium !== undefined) {
      params.push(Boolean(isPremium)); sets.push(`is_premium = $${params.length}`);
    }
    if (premiumExpiresAt !== undefined) {
      params.push(premiumExpiresAt || null); sets.push(`premium_expires_at = $${params.length}`);
    }

    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING id, email, full_name, role, is_premium`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User updated', user: result.rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /admin/users/:id/sessions ─────────────────────────────────────────

router.delete('/users/:id/sessions', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false`,
      [req.params.id]
    );
    res.json({ message: 'All sessions revoked', count: result.rowCount });
  } catch (err) { next(err); }
});

// ── DELETE /admin/users/:id ───────────────────────────────────────────────────

router.delete('/users/:id', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(
      `DELETE FROM users WHERE id = $1 AND role != 'admin' RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found or cannot delete admin' });
    res.json({ message: 'User deleted' });
  } catch (err) { next(err); }
});

// ── Legacy: POST /admin/reset-database ───────────────────────────────────────

router.post('/reset-database', ...adminAuth, async (req, res, next) => {
  try {
    if (req.admin?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tables = [
        'biometric_credentials','trusted_devices','refresh_tokens','otp_codes',
        'lesson_progress','module_progress','quiz_attempts','mock_test_attempts',
        'user_achievements','user_rewards','user_streaks','xp_exchange_redemptions',
        'xp_transactions','user_activity_log','hazard_reports','user_notes',
        'user_bookmarks','referrals','user_invites','driver_documents','user_reminders',
        'fleet_drivers','fleet_compliance_items','fleet_certifications','school_students',
        'school_certificates','parent_guardian_links','guardian_alerts',
        'premium_sponsorships','renewal_bookings','ai_messages','ai_conversations',
      ];
      for (const t of tables) await client.query(`DELETE FROM ${t}`);
      await client.query(`DELETE FROM users WHERE role != 'admin'`);
      await client.query('COMMIT');
      res.json({ message: 'Database cleaned (admin accounts preserved)', timestamp: new Date().toISOString() });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

// ============================================================================
// CONTENT MANAGEMENT — MODULES
// ============================================================================

// GET /admin/content/modules
router.get('/content/modules', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT m.id, m.slug, m.title_en, m.description_en, m.icon, m.sort_order,
             m.is_free, m.is_premium, m.estimated_minutes, m.xp_reward,
             (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lesson_count,
             (SELECT COUNT(*) FROM questions WHERE module_id = m.id) as question_count
      FROM modules m ORDER BY m.sort_order
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /admin/content/modules
router.post('/content/modules', ...adminAuth, async (req, res, next) => {
  try {
    const { slug, title_en, description_en, icon, sort_order, is_free, is_premium, estimated_minutes, xp_reward } = req.body;
    if (!slug || !title_en || !icon) return res.status(400).json({ error: 'slug, title_en, and icon are required' });
    const result = await pool.query(
      `INSERT INTO modules (slug, title_en, description_en, icon, sort_order, is_free, is_premium, estimated_minutes, xp_reward)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [slug, title_en, description_en || null, icon, sort_order || 0, is_free || false, is_premium || false, estimated_minutes || 60, xp_reward || 500]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /admin/content/modules/:id
router.patch('/content/modules/:id', ...adminAuth, async (req, res, next) => {
  try {
    const { title_en, description_en, icon, sort_order, is_free, is_premium, estimated_minutes, xp_reward } = req.body;
    const result = await pool.query(
      `UPDATE modules SET
        title_en = COALESCE($1, title_en),
        description_en = COALESCE($2, description_en),
        icon = COALESCE($3, icon),
        sort_order = COALESCE($4, sort_order),
        is_free = COALESCE($5, is_free),
        is_premium = COALESCE($6, is_premium),
        estimated_minutes = COALESCE($7, estimated_minutes),
        xp_reward = COALESCE($8, xp_reward)
       WHERE id = $9 RETURNING *`,
      [title_en, description_en, icon, sort_order, is_free, is_premium, estimated_minutes, xp_reward, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Module not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /admin/content/modules/:id
router.delete('/content/modules/:id', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(`DELETE FROM modules WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Module not found' });
    res.json({ message: 'Module deleted' });
  } catch (err) { next(err); }
});

// ============================================================================
// CONTENT MANAGEMENT — QUESTIONS
// ============================================================================

// GET /admin/content/questions?module_id=&page=&search=
router.get('/content/questions', ...adminAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const offset = (page - 1) * limit;
    const moduleId = req.query.module_id ? parseInt(req.query.module_id) : null;
    const search = req.query.search?.trim() || '';
    const mockOnly = req.query.mock_only === 'true';

    const params = [];
    const conditions = [];
    if (moduleId) { params.push(moduleId); conditions.push(`q.module_id = $${params.length}`); }
    if (search) { params.push(`%${search}%`); conditions.push(`q.question_en ILIKE $${params.length}`); }
    if (mockOnly) conditions.push(`q.is_mock_test_eligible = true`);
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const total = parseInt((await pool.query(`SELECT COUNT(*) FROM questions q ${where}`, params)).rows[0].count);
    params.push(limit, offset);
    const result = await pool.query(`
      SELECT q.id, q.module_id, q.lesson_id, q.topic_tag, q.question_type,
             q.question_en, q.options_en, q.correct_answer, q.explanation_en,
             q.difficulty, q.is_mock_test_eligible, q.created_at,
             m.title_en as module_title
      FROM questions q
      LEFT JOIN modules m ON m.id = q.module_id
      ${where}
      ORDER BY q.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ questions: result.rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

// POST /admin/content/questions
router.post('/content/questions', ...adminAuth, async (req, res, next) => {
  try {
    const {
      module_id, lesson_id, topic_tag, question_type,
      question_en, options_en, correct_answer, explanation_en,
      difficulty, is_mock_test_eligible
    } = req.body;

    if (!module_id || !question_en || !options_en || correct_answer === undefined || !topic_tag) {
      return res.status(400).json({ error: 'module_id, topic_tag, question_en, options_en, and correct_answer are required' });
    }
    if (!Array.isArray(options_en) || options_en.length < 2) {
      return res.status(400).json({ error: 'options_en must be an array with at least 2 items' });
    }

    const result = await pool.query(
      `INSERT INTO questions
        (module_id, lesson_id, topic_tag, question_type, question_en, options_en,
         correct_answer, explanation_en, difficulty, is_mock_test_eligible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        module_id, lesson_id || null, topic_tag,
        question_type || 'multiple_choice',
        question_en, JSON.stringify(options_en),
        correct_answer, explanation_en || null,
        difficulty || 1, is_mock_test_eligible !== false
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /admin/content/questions/:id
router.patch('/content/questions/:id', ...adminAuth, async (req, res, next) => {
  try {
    const {
      module_id, lesson_id, topic_tag, question_type,
      question_en, options_en, correct_answer, explanation_en,
      difficulty, is_mock_test_eligible
    } = req.body;

    const result = await pool.query(
      `UPDATE questions SET
        module_id = COALESCE($1, module_id),
        lesson_id = COALESCE($2, lesson_id),
        topic_tag = COALESCE($3, topic_tag),
        question_type = COALESCE($4, question_type),
        question_en = COALESCE($5, question_en),
        options_en = COALESCE($6, options_en),
        correct_answer = COALESCE($7, correct_answer),
        explanation_en = COALESCE($8, explanation_en),
        difficulty = COALESCE($9, difficulty),
        is_mock_test_eligible = COALESCE($10, is_mock_test_eligible)
       WHERE id = $11 RETURNING *`,
      [
        module_id || null, lesson_id || null, topic_tag || null, question_type || null,
        question_en || null, options_en ? JSON.stringify(options_en) : null,
        correct_answer !== undefined ? correct_answer : null,
        explanation_en || null, difficulty || null,
        is_mock_test_eligible !== undefined ? is_mock_test_eligible : null,
        req.params.id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /admin/content/questions/:id
router.delete('/content/questions/:id', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(`DELETE FROM questions WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
    res.json({ message: 'Question deleted' });
  } catch (err) { next(err); }
});

// POST /admin/content/questions/bulk  — import array of questions
router.post('/content/questions/bulk', ...adminAuth, async (req, res, next) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions array required' });
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let inserted = 0;
      for (const q of questions) {
        if (!q.module_id || !q.question_en || !q.options_en || q.correct_answer === undefined || !q.topic_tag) continue;
        await client.query(
          `INSERT INTO questions
            (module_id, lesson_id, topic_tag, question_type, question_en, options_en,
             correct_answer, explanation_en, difficulty, is_mock_test_eligible)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            q.module_id, q.lesson_id || null, q.topic_tag,
            q.question_type || 'multiple_choice',
            q.question_en, JSON.stringify(q.options_en),
            q.correct_answer, q.explanation_en || null,
            q.difficulty || 1, q.is_mock_test_eligible !== false
          ]
        );
        inserted++;
      }
      await client.query('COMMIT');
      res.status(201).json({ message: `${inserted} question(s) imported`, inserted });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
});

// ============================================================================
// TESTS — CRUD
// ============================================================================

// GET /admin/content/tests
router.get('/content/tests', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT t.*,
             m.title_en as module_title,
             (SELECT COUNT(*) FROM test_questions tq WHERE tq.test_id = t.id) as actual_question_count
      FROM tests t
      LEFT JOIN modules m ON m.id = t.module_id
      ORDER BY t.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /admin/content/tests/:id
router.get('/content/tests/:id', ...adminAuth, async (req, res, next) => {
  try {
    const testResult = await pool.query(`
      SELECT t.*, m.title_en as module_title
      FROM tests t
      LEFT JOIN modules m ON m.id = t.module_id
      WHERE t.id = $1
    `, [req.params.id]);

    if (testResult.rows.length === 0) return res.status(404).json({ error: 'Test not found' });

    const questionsResult = await pool.query(`
      SELECT q.id, q.module_id, q.topic_tag, q.question_type, q.question_en,
             q.options_en, q.correct_answer, q.explanation_en, q.difficulty,
             q.is_mock_test_eligible, tq.sort_order
      FROM test_questions tq
      JOIN questions q ON q.id = tq.question_id
      WHERE tq.test_id = $1
      ORDER BY tq.sort_order
    `, [req.params.id]);

    res.json({ ...testResult.rows[0], questions: questionsResult.rows });
  } catch (err) { next(err); }
});

// POST /admin/content/tests
router.post('/content/tests', ...adminAuth, async (req, res, next) => {
  try {
    const { title, description, module_id, topic_tag, time_limit_minutes, pass_mark, is_active } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const result = await pool.query(
      `INSERT INTO tests (title, description, module_id, topic_tag, time_limit_minutes, pass_mark, is_active, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description || null, module_id || null, topic_tag || null,
       time_limit_minutes || 30, pass_mark || 70, is_active !== false, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /admin/content/tests/:id
router.patch('/content/tests/:id', ...adminAuth, async (req, res, next) => {
  try {
    const { title, description, module_id, topic_tag, time_limit_minutes, pass_mark, is_active } = req.body;
    const result = await pool.query(
      `UPDATE tests SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        module_id = COALESCE($3, module_id),
        topic_tag = COALESCE($4, topic_tag),
        time_limit_minutes = COALESCE($5, time_limit_minutes),
        pass_mark = COALESCE($6, pass_mark),
        is_active = COALESCE($7, is_active)
       WHERE id = $8 RETURNING *`,
      [title || null, description || null, module_id || null, topic_tag || null,
       time_limit_minutes || null, pass_mark || null,
       is_active !== undefined ? is_active : null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Test not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /admin/content/tests/:id
router.delete('/content/tests/:id', ...adminAuth, async (req, res, next) => {
  try {
    const result = await pool.query(`DELETE FROM tests WHERE id = $1 RETURNING id`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Test not found' });
    res.json({ message: 'Test deleted' });
  } catch (err) { next(err); }
});

// POST /admin/content/tests/:id/questions — attach questions to a test
router.post('/content/tests/:id/questions', ...adminAuth, async (req, res, next) => {
  try {
    const { question_ids } = req.body;
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
      return res.status(400).json({ error: 'question_ids array required' });
    }

    const testExists = await pool.query(`SELECT id FROM tests WHERE id = $1`, [req.params.id]);
    if (testExists.rows.length === 0) return res.status(404).json({ error: 'Test not found' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let added = 0;
      for (let i = 0; i < question_ids.length; i++) {
        const qid = question_ids[i];
        await client.query(
          `INSERT INTO test_questions (test_id, question_id, sort_order)
           VALUES ($1, $2, $3)
           ON CONFLICT (test_id, question_id) DO NOTHING`,
          [req.params.id, qid, i]
        );
        added++;
      }
      await client.query(
        `UPDATE tests SET question_count = (SELECT COUNT(*) FROM test_questions WHERE test_id = $1) WHERE id = $1`,
        [req.params.id]
      );
      await client.query('COMMIT');
      res.json({ message: `${added} question(s) attached to test`, added });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
});

// DELETE /admin/content/tests/:id/questions/:questionId — remove a question from a test
router.delete('/content/tests/:id/questions/:questionId', ...adminAuth, async (req, res, next) => {
  try {
    await pool.query(
      `DELETE FROM test_questions WHERE test_id = $1 AND question_id = $2`,
      [req.params.id, req.params.questionId]
    );
    await pool.query(
      `UPDATE tests SET question_count = (SELECT COUNT(*) FROM test_questions WHERE test_id = $1) WHERE id = $1`,
      [req.params.id]
    );
    res.json({ message: 'Question removed from test' });
  } catch (err) { next(err); }
});

// ============================================================================
// FILE UPLOAD — Parse Excel/CSV and return preview (no DB insert)
// ============================================================================

// POST /admin/content/questions/upload — parse file, return preview rows
router.post('/content/questions/upload', ...adminAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const XLSX = (await import('xlsx')).default;
    const buf = req.file.buffer;
    const workbook = XLSX.read(buf, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'File is empty or has invalid format' });
    }

    const defaultModuleId = req.body.default_module_id ? parseInt(req.body.default_module_id) : null;
    const defaultTopicTag = req.body.default_topic_tag || null;

    const parsed = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      // Parse options
      let options = [];
      if (row.options) {
        options = String(row.options).split(',').map(o => o.trim()).filter(Boolean);
      } else if (row['Option A'] || row['Option B']) {
        options = [row['Option A'], row['Option B'], row['Option C'], row['Option D']].filter(Boolean);
      } else if (row.option_a || row.option_b) {
        options = [row.option_a, row.option_b, row.option_c, row.option_d].filter(Boolean);
      }

      if (options.length < 2) {
        errors.push({ row: rowNum, error: `At least 2 options required. Columns found: ${Object.keys(row).join(', ')}` });
        continue;
      }

      // Parse correct answer
      let correctAnswer;
      if (row.Answer !== undefined) {
        const ans = String(row.Answer).trim().toUpperCase();
        if (ans.length === 1 && ans >= 'A' && ans <= 'Z') {
          correctAnswer = ans.charCodeAt(0) - 65;
        } else {
          correctAnswer = parseInt(ans, 10);
        }
      } else {
        correctAnswer = parseInt(String(row.correct_answer), 10);
      }

      if (isNaN(correctAnswer) || correctAnswer < 0 || correctAnswer >= options.length) {
        errors.push({ row: rowNum, error: `Answer must be A-${String.fromCharCode(65 + options.length - 1)} or 0-${options.length - 1}` });
        continue;
      }

      const questionText = String(row.question || row.question_en || row.Question || '').trim();
      if (!questionText) {
        errors.push({ row: rowNum, error: 'Question text is empty' });
        continue;
      }

      parsed.push({
        row: rowNum,
        module_id: row.module_id ? parseInt(String(row.module_id), 10) : defaultModuleId,
        topic_tag: String(row.topic_tag || defaultTopicTag || 'general'),
        question_en: questionText,
        options_en: options,
        correct_answer: correctAnswer,
        explanation_en: String(row.explanation || row.explanation_en || '').trim() || null,
        difficulty: parseInt(String(row.difficulty), 10) || 1,
        is_mock_test_eligible: row.is_mock_test_eligible === true || row.is_mock_test_eligible === 'true' || row.is_mock_test_eligible === 1 || row.is_mock_test_eligible === undefined,
        question_type: String(row.question_type || 'multiple_choice'),
      });
    }

    res.json({ parsed, errors, totalRows: rows.length, validCount: parsed.length });
  } catch (err) {
    console.error('Upload parse error:', err);
    next(err);
  }
});

// POST /admin/content/questions/confirm-import — insert previewed questions
router.post('/content/questions/confirm-import', ...adminAuth, async (req, res, next) => {
  try {
    const { questions, test_id } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'questions array required' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const insertedIds = [];
      let inserted = 0;

      for (const q of questions) {
        if (!q.module_id || !q.question_en || !q.options_en || q.correct_answer === undefined || !q.topic_tag) continue;
        const result = await client.query(
          `INSERT INTO questions
            (module_id, lesson_id, topic_tag, question_type, question_en, options_en,
             correct_answer, explanation_en, difficulty, is_mock_test_eligible)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
          [
            q.module_id, q.lesson_id || null, q.topic_tag,
            q.question_type || 'multiple_choice',
            q.question_en, JSON.stringify(q.options_en),
            q.correct_answer, q.explanation_en || null,
            q.difficulty || 1, q.is_mock_test_eligible !== false
          ]
        );
        if (result.rows[0]) insertedIds.push(result.rows[0].id);
        inserted++;
      }

      // If test_id provided, attach all imported questions to the test
      if (test_id && insertedIds.length > 0) {
        for (let i = 0; i < insertedIds.length; i++) {
          await client.query(
            `INSERT INTO test_questions (test_id, question_id, sort_order)
             VALUES ($1, $2, $3)
             ON CONFLICT (test_id, question_id) DO NOTHING`,
            [test_id, insertedIds[i], i]
          );
        }
        await client.query(
          `UPDATE tests SET question_count = (SELECT COUNT(*) FROM test_questions WHERE test_id = $1) WHERE id = $1`,
          [test_id]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({
        message: `${inserted} question(s) imported${test_id ? ' and attached to test' : ''}`,
        inserted,
        question_ids: insertedIds,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally { client.release(); }
  } catch (err) { next(err); }
});

export default router;
