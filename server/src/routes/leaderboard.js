import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// GET /leaderboard?period=weekly|alltime
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'weekly';
    const limit = parseInt(req.query.limit) || 20;

    let query;
    if (period === 'weekly') {
      // Weekly XP earned (last 7 days)
      query = await pool.query(`
        SELECT 
          u.id, u.full_name, u.xp_total, u.streak_current,
          COALESCE(weekly.xp, 0) as weekly_xp
        FROM users u
        LEFT JOIN (
          SELECT user_id, SUM(amount) as xp
          FROM xp_ledger
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY user_id
        ) weekly ON weekly.user_id = u.id
        WHERE u.role = 'learner'
        ORDER BY weekly_xp DESC, u.xp_total DESC
        LIMIT $1
      `, [limit]);
    } else {
      // All-time XP
      query = await pool.query(`
        SELECT id, full_name, xp_total, streak_current, xp_total as weekly_xp
        FROM users
        WHERE role = 'learner'
        ORDER BY xp_total DESC
        LIMIT $1
      `, [limit]);
    }

    const leaderboard = query.rows.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.full_name || 'Learner',
      xp: period === 'weekly' ? parseInt(u.weekly_xp) : u.xp_total,
      totalXp: u.xp_total,
      streak: u.streak_current,
      isCurrentUser: u.id === userId,
    }));

    // Find current user's position if not in top N
    const currentUserInList = leaderboard.some(u => u.isCurrentUser);
    let currentUserRank = null;

    if (!currentUserInList) {
      const rankQuery = period === 'weekly'
        ? await pool.query(`
            SELECT COUNT(*) + 1 as rank FROM users u
            LEFT JOIN (
              SELECT user_id, SUM(amount) as xp FROM xp_ledger
              WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY user_id
            ) weekly ON weekly.user_id = u.id
            WHERE u.role = 'learner' AND COALESCE(weekly.xp, 0) > (
              SELECT COALESCE(SUM(amount), 0) FROM xp_ledger
              WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
            )
          `, [userId])
        : await pool.query(`
            SELECT COUNT(*) + 1 as rank FROM users
            WHERE role = 'learner' AND xp_total > (SELECT xp_total FROM users WHERE id = $1)
          `, [userId]);

      currentUserRank = parseInt(rankQuery.rows[0].rank);
    }

    res.json({
      period,
      leaderboard,
      currentUserRank,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
