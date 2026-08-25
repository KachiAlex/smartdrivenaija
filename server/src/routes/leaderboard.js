import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// GET /leaderboard?period=weekly|alltime|score
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || 'weekly';
    const limit = parseInt(req.query.limit) || 20;

    let query;
    if (period === 'score') {
      // Driver Score leaderboard
      query = await pool.query(`
        SELECT 
          u.id, u.full_name, u.xp_total, u.streak_current,
          -- Calculate driver score components
          (
            LEAST((COUNT(DISTINCT CASE WHEN ump.status = 'completed' THEN ump.module_id END) * 1.0 / NULLIF(COUNT(DISTINCT ump.module_id), 0)) * 40, 40) +
            LEAST(AVG(CASE WHEN qh.percentage IS NOT NULL THEN qh.percentage ELSE 0 END) * 0.3, 30) +
            LEAST(u.streak_current * 2, 20) +
            LEAST(u.xp_total / 100.0, 10)
          ) as driver_score
        FROM users u
        LEFT JOIN user_module_progress ump ON u.id = ump.user_id
        LEFT JOIN quiz_history qh ON u.id = qh.user_id AND qh.completed_at >= NOW() - INTERVAL '30 days'
        WHERE u.role = 'learner'
        GROUP BY u.id, u.full_name, u.xp_total, u.streak_current
        ORDER BY driver_score DESC NULLS LAST
        LIMIT $1
      `, [limit]);
    } else if (period === 'weekly') {
      // Weekly XP earned (last 7 days)
      query = await pool.query(`
        SELECT 
          u.id, u.full_name, u.xp_total, u.streak_current,
          COALESCE(weekly.xp, 0) as weekly_xp,
          0 as driver_score
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
        SELECT id, full_name, xp_total, streak_current, xp_total as weekly_xp, 0 as driver_score
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
      driverScore: period === 'score' ? Math.round(u.driver_score || 0) : null,
      isCurrentUser: u.id === userId,
    }));

    // Find current user's position if not in top N
    const currentUserInList = leaderboard.some(u => u.isCurrentUser);
    let currentUserRank = null;

    if (!currentUserInList) {
      let rankQuery;
      if (period === 'score') {
        rankQuery = await pool.query(`
          SELECT COUNT(*) + 1 as rank FROM (
            SELECT 
              u.id,
              (
                LEAST((COUNT(DISTINCT CASE WHEN ump.status = 'completed' THEN ump.module_id END) * 1.0 / NULLIF(COUNT(DISTINCT ump.module_id), 0)) * 40, 40) +
                LEAST(AVG(CASE WHEN qh.percentage IS NOT NULL THEN qh.percentage ELSE 0 END) * 0.3, 30) +
                LEAST(u.streak_current * 2, 20) +
                LEAST(u.xp_total / 100.0, 10)
              ) as driver_score
            FROM users u
            LEFT JOIN user_module_progress ump ON u.id = ump.user_id
            LEFT JOIN quiz_history qh ON u.id = qh.user_id AND qh.completed_at >= NOW() - INTERVAL '30 days'
            WHERE u.role = 'learner'
            GROUP BY u.id, u.streak_current, u.xp_total
          ) ranked
          WHERE driver_score > (
            SELECT (
              LEAST((COUNT(DISTINCT CASE WHEN ump.status = 'completed' THEN ump.module_id END) * 1.0 / NULLIF(COUNT(DISTINCT ump.module_id), 0)) * 40, 40) +
              LEAST(AVG(CASE WHEN qh.percentage IS NOT NULL THEN qh.percentage ELSE 0 END) * 0.3, 30) +
              LEAST(u.streak_current * 2, 20) +
              LEAST(u.xp_total / 100.0, 10)
            )
            FROM users u
            LEFT JOIN user_module_progress ump ON u.id = ump.user_id
            LEFT JOIN quiz_history qh ON u.id = qh.user_id AND qh.completed_at >= NOW() - INTERVAL '30 days'
            WHERE u.id = $1
            GROUP BY u.id, u.streak_current, u.xp_total
          )
        `, [userId]);
      } else if (period === 'weekly') {
        rankQuery = await pool.query(`
            SELECT COUNT(*) + 1 as rank FROM users u
            LEFT JOIN (
              SELECT user_id, SUM(amount) as xp FROM xp_ledger
              WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY user_id
            ) weekly ON weekly.user_id = u.id
            WHERE u.role = 'learner' AND COALESCE(weekly.xp, 0) > (
              SELECT COALESCE(SUM(amount), 0) FROM xp_ledger
              WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'
            )
          `, [userId]);
      } else {
        rankQuery = await pool.query(`
            SELECT COUNT(*) + 1 as rank FROM users
            WHERE role = 'learner' AND xp_total > (SELECT xp_total FROM users WHERE id = $1)
          `, [userId]);
      }

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
