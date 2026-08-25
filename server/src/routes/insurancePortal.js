import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// POST /insurance/verify-certificate - Certification verification
router.post('/verify-certificate', async (req, res, next) => {
  try {
    const { certificateNumber } = req.body;

    const result = await pool.query(`
      SELECT sc.*, u.full_name, ds.name as school_name, ds.is_verified
      FROM school_certificates sc
      JOIN users u ON sc.user_id = u.id
      JOIN driving_schools ds ON sc.school_id = ds.id
      WHERE sc.certificate_number = $1
    `, [certificateNumber]);

    if (result.rows.length === 0) {
      return res.json({ valid: false, message: 'Certificate not found' });
    }

    const cert = result.rows[0];
    res.json({
      valid: cert.is_valid && new Date(cert.expires_at) > new Date(),
      certificate: {
        number: cert.certificate_number,
        holderName: cert.full_name,
        school: cert.school_name,
        schoolVerified: cert.is_verified,
        issuedAt: cert.issued_at,
        expiresAt: cert.expires_at
      }
    });
  } catch (err) { next(err); }
});

// GET /insurance/driver-profile/:userId - Driver risk profiles
router.get('/driver-profile/:userId', authenticate, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId);

    const scoreResult = await pool.query(`
      SELECT score FROM driver_scores WHERE user_id = $1 ORDER BY calculated_at DESC LIMIT 1
    `, [userId]);

    const quizResult = await pool.query(`
      SELECT COUNT(*) as total,
             AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 as accuracy
      FROM quiz_answers WHERE user_id = $1
    `, [userId]);

    const streakResult = await pool.query(`
      SELECT streak_days FROM users WHERE id = $1
    `, [userId]);

    const driverScore = scoreResult.rows[0]?.score || 0;
    const quizAccuracy = parseFloat(quizResult.rows[0]?.accuracy || 0);
    const streak = streakResult.rows[0]?.streak_days || 0;

    res.json({
      driverProfile: {
        userId,
        driverScore,
        quizAccuracy: Math.round(quizAccuracy),
        learningStreak: streak,
        riskLevel: driverScore > 80 ? 'low' : driverScore > 50 ? 'medium' : 'high',
        safeDriverEligible: driverScore >= 75 && quizAccuracy >= 70,
        recommendedDiscount: driverScore >= 90 ? 20 : driverScore >= 75 ? 15 : driverScore >= 60 ? 10 : 0
      }
    });
  } catch (err) { next(err); }
});

// GET /insurance/safe-driver-discounts - Safe-driver discounts
router.get('/safe-driver-discounts', authenticate, async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, ds.score,
             CASE 
               WHEN ds.score >= 90 THEN 20
               WHEN ds.score >= 75 THEN 15
               WHEN ds.score >= 60 THEN 10
               ELSE 0
             END as discount_percent
      FROM users u
      JOIN driver_scores ds ON u.id = ds.user_id
      WHERE ds.score >= 60
      ORDER BY ds.score DESC
      LIMIT 100
    `);

    res.json({
      safeDriverDiscounts: result.rows.map(r => ({
        userId: r.id,
        name: r.full_name,
        driverScore: r.score,
        discountPercent: r.discount_percent,
        status: r.discount_percent >= 15 ? 'gold' : r.discount_percent >= 10 ? 'silver' : 'bronze'
      })),
      summary: {
        totalEligible: result.rows.length,
        averageDiscount: Math.round(result.rows.reduce((s, r) => s + r.discount_percent, 0) / result.rows.length) || 0
      }
    });
  } catch (err) { next(err); }
});

export default router;
