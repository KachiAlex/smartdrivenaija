import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// POST /admin/reset-database
// Requires ADMIN_SECRET header for safety
router.post('/reset-database', async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Begin transaction
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete in dependency order
      await client.query('DELETE FROM biometric_credentials');
      await client.query('DELETE FROM trusted_devices');
      await client.query('DELETE FROM refresh_tokens');
      await client.query('DELETE FROM otp_codes');
      
      await client.query('DELETE FROM lesson_progress');
      await client.query('DELETE FROM module_progress');
      await client.query('DELETE FROM quiz_attempts');
      await client.query('DELETE FROM mock_test_attempts');
      
      await client.query('DELETE FROM user_achievements');
      await client.query('DELETE FROM user_rewards');
      await client.query('DELETE FROM user_streaks');
      await client.query('DELETE FROM xp_exchange_redemptions');
      await client.query('DELETE FROM xp_transactions');
      await client.query('DELETE FROM user_activity_log');
      
      await client.query('DELETE FROM hazard_reports');
      await client.query('DELETE FROM user_notes');
      await client.query('DELETE FROM user_bookmarks');
      
      await client.query('DELETE FROM referrals');
      await client.query('DELETE FROM user_invites');
      
      await client.query('DELETE FROM driver_documents');
      await client.query('DELETE FROM user_reminders');
      
      await client.query('DELETE FROM fleet_drivers');
      await client.query('DELETE FROM fleet_compliance_items');
      await client.query('DELETE FROM fleet_certifications');
      await client.query('DELETE FROM school_students');
      await client.query('DELETE FROM school_certificates');
      await client.query('DELETE FROM parent_guardian_links');
      await client.query('DELETE FROM guardian_alerts');
      await client.query('DELETE FROM premium_sponsorships');
      await client.query('DELETE FROM renewal_bookings');
      
      await client.query('DELETE FROM ai_messages');
      await client.query('DELETE FROM ai_conversations');
      
      await client.query('DELETE FROM users');

      // Reset sequences
      await client.query("SELECT setval('users_id_seq', 1, false)");
      await client.query("SELECT setval('biometric_credentials_id_seq', 1, false)");
      await client.query("SELECT setval('trusted_devices_id_seq', 1, false)");
      await client.query("SELECT setval('refresh_tokens_id_seq', 1, false)");
      await client.query("SELECT setval('otp_codes_id_seq', 1, false)");

      await client.query('COMMIT');

      res.json({
        message: 'Database cleaned successfully',
        detail: 'All user data has been removed. Schema preserved. Sequences reset.',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) { next(err); }
});

// GET /admin/stats
router.get('/stats', async (req, res, next) => {
  try {
    const adminSecret = req.headers['x-admin-secret'];
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const tables = [
      'users', 'biometric_credentials', 'trusted_devices', 'refresh_tokens', 
      'otp_codes', 'lesson_progress', 'module_progress', 'quiz_attempts',
      'user_achievements', 'xp_transactions', 'hazard_reports'
    ];

    const stats = {};
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = parseInt(result.rows[0].count);
    }

    res.json({ stats, timestamp: new Date().toISOString() });
  } catch (err) { next(err); }
});

export default router;
