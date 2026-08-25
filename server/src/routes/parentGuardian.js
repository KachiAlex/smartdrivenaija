import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// POST /parent-guardian/link - Link parent to student
router.post('/link', authenticate, async (req, res, next) => {
  try {
    const parentUserId = req.user.id;
    const { studentUserId, relationship } = req.body;

    const result = await pool.query(
      `INSERT INTO parent_guardian_links (parent_user_id, student_user_id, relationship)
       VALUES ($1, $2, $3) ON CONFLICT (parent_user_id, student_user_id) DO UPDATE SET relationship = $3 RETURNING *`,
      [parentUserId, studentUserId, relationship || 'parent']
    );

    res.status(201).json({ link: result.rows[0] });
  } catch (err) { next(err); }
});

// GET /parent-guardian/students - Get linked students for parent
router.get('/students', authenticate, async (req, res, next) => {
  try {
    const parentUserId = req.user.id;

    const result = await pool.query(
      `SELECT pgl.*, u.full_name, u.email, u.phone, u.xp, u.streak_days
       FROM parent_guardian_links pgl
       JOIN users u ON pgl.student_user_id = u.id
       WHERE pgl.parent_user_id = $1 AND pgl.is_approved = TRUE`,
      [parentUserId]
    );

    res.json({ students: result.rows });
  } catch (err) { next(err); }
});

// GET /parent-guardian/progress/:studentId - Monitor student progress
router.get('/progress/:studentId', authenticate, async (req, res, next) => {
  try {
    const parentUserId = req.user.id;
    const studentId = parseInt(req.params.studentId);

    // Verify link exists
    const linkCheck = await pool.query(
      `SELECT id FROM parent_guardian_links WHERE parent_user_id = $1 AND student_user_id = $2 AND is_approved = TRUE`,
      [parentUserId, studentId]
    );

    if (linkCheck.rows.length === 0) {
      return res.status(403).json({ error: 'No approved link found with this student' });
    }

    // Get student progress
    const modulesResult = await pool.query(
      `SELECT m.id, m.title, mp.is_completed, mp.completed_at, mp.progress_percentage
       FROM modules m
       LEFT JOIN module_progress mp ON m.id = mp.module_id AND mp.user_id = $1
       ORDER BY m.id`,
      [studentId]
    );

    const quizzesResult = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(CASE WHEN is_correct THEN 1 END) as correct,
              AVG(CASE WHEN is_correct THEN 1 ELSE 0 END) * 100 as accuracy
       FROM quiz_answers WHERE user_id = $1`,
      [studentId]
    );

    res.json({
      studentId,
      modules: modulesResult.rows,
      quizStats: quizzesResult.rows[0],
    });
  } catch (err) { next(err); }
});

// GET /parent-guardian/alerts - Get guardian alerts
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const parentUserId = req.user.id;

    const result = await pool.query(
      `SELECT ga.*, u.full_name as student_name
       FROM guardian_alerts ga
       JOIN users u ON ga.student_user_id = u.id
       WHERE ga.parent_user_id = $1
       ORDER BY ga.created_at DESC`,
      [parentUserId]
    );

    res.json({ alerts: result.rows });
  } catch (err) { next(err); }
});

// POST /parent-guardian/alerts/:id/read - Mark alert as read
router.post('/alerts/:id/read', authenticate, async (req, res, next) => {
  try {
    const parentUserId = req.user.id;
    const alertId = parseInt(req.params.id);

    await pool.query(
      `UPDATE guardian_alerts SET is_read = TRUE WHERE id = $1 AND parent_user_id = $2`,
      [alertId, parentUserId]
    );

    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /parent-guardian/sponsor - Gift premium subscription
router.post('/sponsor', authenticate, async (req, res, next) => {
  try {
    const sponsorUserId = req.user.id;
    const { beneficiaryUserId, planType, durationMonths } = req.body;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (durationMonths || 1));

    const result = await pool.query(
      `INSERT INTO premium_sponsorships (sponsor_user_id, beneficiary_user_id, plan_type, end_date)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sponsorUserId, beneficiaryUserId, planType, endDate]
    );

    res.status(201).json({ sponsorship: result.rows[0] });
  } catch (err) { next(err); }
});

export default router;
