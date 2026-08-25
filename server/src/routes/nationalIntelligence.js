import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// GET /national-intelligence/hazard-intelligence - Hazard intelligence
router.get('/hazard-intelligence', async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const hotspots = await pool.query(`
      SELECT latitude, longitude, COUNT(*) as incident_count,
             AVG(severity) as avg_severity,
             mode() WITHIN GROUP (ORDER BY hazard_type) as common_type
      FROM hazard_reports
      WHERE reported_at > NOW() - INTERVAL '${days} days'
      GROUP BY latitude, longitude
      HAVING COUNT(*) > 2
      ORDER BY incident_count DESC
      LIMIT 50
    `);

    res.json({
      hazardIntelligence: {
        timeframe: `${days} days`,
        hotspots: hotspots.rows.map(h => ({
          location: { lat: h.latitude, lng: h.longitude },
          incidentCount: parseInt(h.incident_count),
          averageSeverity: parseFloat(h.avg_severity).toFixed(2),
          commonHazardType: h.common_type
        }))
      }
    });
  } catch (err) { next(err); }
});

// GET /national-intelligence/language-analytics - Language usage analytics
router.get('/language-analytics', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT preferred_language, COUNT(*) as user_count
      FROM users
      WHERE preferred_language IS NOT NULL
      GROUP BY preferred_language
      ORDER BY user_count DESC
    `);

    const aiLanguageUsage = await pool.query(`
      SELECT language, COUNT(*) as conversation_count
      FROM ai_coach_conversations
      GROUP BY language
      ORDER BY conversation_count DESC
    `);

    res.json({
      languageAnalytics: {
        userPreferences: result.rows.map(r => ({
          language: r.preferred_language,
          userCount: parseInt(r.user_count),
          percentage: 0
        })).map((l, i, arr) => ({ ...l, percentage: Math.round((l.userCount / arr.reduce((s, x) => s + x.userCount, 0)) * 100) })),
        aiCoachUsage: aiLanguageUsage.rows.map(r => ({
          language: r.language,
          conversationCount: parseInt(r.conversation_count)
        }))
      }
    });
  } catch (err) { next(err); }
});

// GET /national-intelligence/safety-risk-patterns - Safety risk patterns
router.get('/safety-risk-patterns', async (req, res, next) => {
  try {
    const timeOfDay = await pool.query(`
      SELECT EXTRACT(HOUR FROM reported_at) as hour,
             COUNT(*) as incident_count,
             AVG(severity) as avg_severity
      FROM hazard_reports
      WHERE reported_at > NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM reported_at)
      ORDER BY hour
    `);

    const riskByDay = await pool.query(`
      SELECT EXTRACT(DOW FROM reported_at) as day_of_week,
             COUNT(*) as incident_count
      FROM hazard_reports
      WHERE reported_at > NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(DOW FROM reported_at)
      ORDER BY day_of_week
    `);

    res.json({
      safetyRiskPatterns: {
        timeOfDay: timeOfDay.rows.map(t => ({
          hour: parseInt(t.hour),
          incidentCount: parseInt(t.incident_count),
          riskLevel: t.avg_severity > 3 ? 'high' : t.avg_severity > 2 ? 'medium' : 'low'
        })),
        dayOfWeek: riskByDay.rows.map(d => ({
          day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][parseInt(d.day_of_week)],
          incidentCount: parseInt(d.incident_count)
        }))
      }
    });
  } catch (err) { next(err); }
});

// POST /national-intelligence/anonymous-report - Anonymous trend reporting
router.post('/anonymous-report', async (req, res, next) => {
  try {
    const { reportType, category, description, location, severity } = req.body;

    const result = await pool.query(`
      INSERT INTO anonymous_trend_reports (report_type, category, description, latitude, longitude, severity, reported_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *
    `, [reportType, category, description, location?.lat, location?.lng, severity]);

    res.status(201).json({
      report: {
        id: result.rows[0].id,
        type: result.rows[0].report_type,
        category: result.rows[0].category,
        severity: result.rows[0].severity,
        reportedAt: result.rows[0].reported_at
      }
    });
  } catch (err) { next(err); }
});

export default router;
