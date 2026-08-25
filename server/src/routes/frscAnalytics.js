import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// GET /frsc-analytics/insights - Anonymized insights
router.get('/insights', async (req, res, next) => {
  try {
    const totalUsers = await pool.query('SELECT COUNT(*) FROM users');
    const totalQuizzes = await pool.query('SELECT COUNT(*) FROM quiz_answers');
    const avgScore = await pool.query('SELECT AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 as avg FROM quiz_answers');
    const completionRate = await pool.query(`
      SELECT AVG(CASE WHEN is_completed THEN 1 ELSE 0 END) * 100 as rate 
      FROM module_progress
    `);

    res.json({
      insights: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalQuizzesTaken: parseInt(totalQuizzes.rows[0].count),
        averageQuizScore: Math.round(avgScore.rows[0].avg || 0),
        moduleCompletionRate: Math.round(completionRate.rows[0].rate || 0),
      }
    });
  } catch (err) { next(err); }
});

// GET /frsc-analytics/knowledge-gaps - Knowledge gap mapping
router.get('/knowledge-gaps', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT m.title as module, 
             COUNT(*) as total_attempts,
             AVG(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) * 100 as avg_score
      FROM quiz_answers qa
      JOIN questions q ON qa.question_id = q.id
      JOIN modules m ON q.module_id = m.id
      GROUP BY m.id, m.title
      ORDER BY avg_score ASC
    `);

    res.json({
      knowledgeGaps: result.rows.map(r => ({
        module: r.module,
        totalAttempts: parseInt(r.total_attempts),
        averageScore: Math.round(r.avg_score),
        gapLevel: r.avg_score < 50 ? 'critical' : r.avg_score < 70 ? 'moderate' : 'low'
      }))
    });
  } catch (err) { next(err); }
});

// GET /frsc-analytics/regional-risk - Regional risk analysis
router.get('/regional-risk', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT state, COUNT(*) as hazard_count,
             AVG(severity) as avg_severity
      FROM hazard_reports
      WHERE reported_at > NOW() - INTERVAL '30 days'
      GROUP BY state
      ORDER BY hazard_count DESC
    `);

    res.json({
      regionalRisk: result.rows.map(r => ({
        state: r.state,
        hazardCount: parseInt(r.hazard_count),
        averageSeverity: parseFloat(r.avg_severity).toFixed(2),
        riskLevel: r.hazard_count > 50 ? 'high' : r.hazard_count > 20 ? 'medium' : 'low'
      }))
    });
  } catch (err) { next(err); }
});

// GET /frsc-analytics/state-performance - State performance comparison
router.get('/state-performance', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.state,
             COUNT(DISTINCT u.id) as user_count,
             AVG(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) * 100 as avg_score,
             AVG(ds.score) as driver_score
      FROM users u
      LEFT JOIN quiz_answers qa ON u.id = qa.user_id
      LEFT JOIN driver_scores ds ON u.id = ds.user_id
      WHERE u.state IS NOT NULL
      GROUP BY u.state
      ORDER BY avg_score DESC
    `);

    res.json({
      statePerformance: result.rows.map(r => ({
        state: r.state,
        activeUsers: parseInt(r.user_count),
        averageQuizScore: Math.round(r.avg_score || 0),
        averageDriverScore: Math.round(r.driver_score || 0),
        ranking: 0
      })).map((s, i) => ({ ...s, ranking: i + 1 }))
    });
  } catch (err) { next(err); }
});

export default router;
