import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db/pool.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

// ── Auth helpers ─────────────────────────────────────────────────────────────

const adminAuth = [authenticate, requireRole('admin')];

// ── POST /admin/login ─────────────────────────────────────────────────────────

router.post('/login', async (req, res, next) => {
  try {
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
  } catch (err) { next(err); }
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
      pool.query(`SELECT COUNT(*) FROM users WHERE role != 'admin'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE is_premium = true`),
      pool.query(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '24 hours' AND role != 'admin'`),
      pool.query(`SELECT COUNT(*) FROM otp_codes WHERE created_at >= NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(*) FROM refresh_tokens WHERE revoked = false AND expires_at > NOW()`),
    ]);

    const roleBreakdown = await pool.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`
    );

    const signupsLast7Days = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '7 days' AND role != 'admin'
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

router.post('/reset-database', async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
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

export default router;
