import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// GET /driving-schools - Search and compare driving schools
router.get('/', async (req, res, next) => {
  try {
    const { state, city, verified, limit = 20 } = req.query;

    let query = `
      SELECT id, name, address, city, state, phone, email, website, 
             latitude, longitude, rating, review_count, is_verified, is_active
      FROM driving_schools
      WHERE is_active = TRUE
    `;
    const params = [];
    let paramCount = 0;

    if (state) {
      paramCount++;
      query += ` AND state = $${paramCount}`;
      params.push(state);
    }

    if (city) {
      paramCount++;
      query += ` AND city = $${paramCount}`;
      params.push(city);
    }

    if (verified === 'true') {
      query += ` AND is_verified = TRUE`;
    }

    query += ` ORDER BY rating DESC, review_count DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      schools: result.rows.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address,
        city: s.city,
        state: s.state,
        phone: s.phone,
        email: s.email,
        website: s.website,
        latitude: s.latitude,
        longitude: s.longitude,
        rating: s.rating,
        reviewCount: s.review_count,
        isVerified: s.is_verified,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /driving-schools/:id - Get school details
router.get('/:id', async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT * FROM driving_schools WHERE id = $1 AND is_active = TRUE`,
      [schoolId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    const s = result.rows[0];
    res.json({
      id: s.id,
      name: s.name,
      address: s.address,
      city: s.city,
      state: s.state,
      phone: s.phone,
      email: s.email,
      website: s.website,
      latitude: s.latitude,
      longitude: s.longitude,
      rating: s.rating,
      reviewCount: s.review_count,
      isVerified: s.is_verified,
      createdAt: s.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// POST /driving-schools/:id/enroll - Enroll in a driving school
router.post('/:id/enroll', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const schoolId = parseInt(req.params.id);

    const schoolCheck = await pool.query(
      `SELECT id FROM driving_schools WHERE id = $1 AND is_active = TRUE`,
      [schoolId]
    );

    if (schoolCheck.rows.length === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    const result = await pool.query(
      `INSERT INTO school_students (school_id, user_id, enrollment_date, status)
       VALUES ($1, $2, CURRENT_DATE, 'active')
       ON CONFLICT (school_id, user_id) DO UPDATE SET status = 'active', enrollment_date = CURRENT_DATE
       RETURNING *`,
      [schoolId, userId]
    );

    res.status(201).json({
      enrollment: {
        id: result.rows[0].id,
        schoolId: result.rows[0].school_id,
        userId: result.rows[0].user_id,
        enrollmentDate: result.rows[0].enrollment_date,
        status: result.rows[0].status,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /driving-schools/:id/students - Get students for a school (school admin)
router.get('/:id/students', authenticate, async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);
    const { status } = req.query;

    let query = `
      SELECT ss.id, ss.user_id, ss.enrollment_date, ss.status, ss.completion_date, ss.notes,
             u.full_name, u.phone, u.email
      FROM school_students ss
      JOIN users u ON ss.user_id = u.id
      WHERE ss.school_id = $1
    `;
    const params = [schoolId];
    let paramCount = 1;

    if (status) {
      paramCount++;
      query += ` AND ss.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY ss.enrollment_date DESC`;

    const result = await pool.query(query, params);

    res.json({
      students: result.rows.map(s => ({
        id: s.id,
        userId: s.user_id,
        fullName: s.full_name,
        phone: s.phone,
        email: s.email,
        enrollmentDate: s.enrollment_date,
        status: s.status,
        completionDate: s.completion_date,
        notes: s.notes,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// PUT /driving-schools/students/:id - Update student status
router.put('/students/:id', authenticate, async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const { status, completionDate, notes } = req.body;

    const result = await pool.query(
      `UPDATE school_students
       SET status = COALESCE($1, status),
           completion_date = COALESCE($2, completion_date),
           notes = COALESCE($3, notes)
       WHERE id = $4
       RETURNING *`,
      [status, completionDate, notes, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({
      student: {
        id: result.rows[0].id,
        schoolId: result.rows[0].school_id,
        userId: result.rows[0].user_id,
        enrollmentDate: result.rows[0].enrollment_date,
        status: result.rows[0].status,
        completionDate: result.rows[0].completion_date,
        notes: result.rows[0].notes,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /driving-schools/:id/certificates - Get certificates for a school
router.get('/:id/certificates', authenticate, async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT sc.*, u.full_name
       FROM school_certificates sc
       JOIN users u ON sc.user_id = u.id
       WHERE sc.school_id = $1
       ORDER BY sc.issued_at DESC`,
      [schoolId]
    );

    res.json({
      certificates: result.rows.map(c => ({
        id: c.id,
        certificateNumber: c.certificate_number,
        studentId: c.student_id,
        userId: c.user_id,
        fullName: c.full_name,
        issuedAt: c.issued_at,
        expiresAt: c.expires_at,
        isValid: c.is_valid,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /driving-schools/:id/certificates - Issue a certificate
router.post('/:id/certificates', authenticate, async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);
    const { studentId, userId, expiresAt } = req.body;

    const certificateNumber = `SDN-CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const result = await pool.query(
      `INSERT INTO school_certificates (school_id, student_id, user_id, certificate_number, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [schoolId, studentId, userId, certificateNumber, expiresAt || null]
    );

    // Update student status to completed
    await pool.query(
      `UPDATE school_students SET status = 'completed', completion_date = CURRENT_DATE WHERE id = $1`,
      [studentId]
    );

    res.status(201).json({
      certificate: {
        id: result.rows[0].id,
        certificateNumber: result.rows[0].certificate_number,
        schoolId: result.rows[0].school_id,
        studentId: result.rows[0].student_id,
        userId: result.rows[0].user_id,
        issuedAt: result.rows[0].issued_at,
        expiresAt: result.rows[0].expires_at,
        isValid: result.rows[0].is_valid,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /driving-schools/:id/analytics - Get school analytics
router.get('/:id/analytics', authenticate, async (req, res, next) => {
  try {
    const schoolId = parseInt(req.params.id);

    const totalStudents = await pool.query(
      `SELECT COUNT(*) as total FROM school_students WHERE school_id = $1`,
      [schoolId]
    );

    const activeStudents = await pool.query(
      `SELECT COUNT(*) as active FROM school_students WHERE school_id = $1 AND status = 'active'`,
      [schoolId]
    );

    const completedStudents = await pool.query(
      `SELECT COUNT(*) as completed FROM school_students WHERE school_id = $1 AND status = 'completed'`,
      [schoolId]
    );

    const certificatesIssued = await pool.query(
      `SELECT COUNT(*) as total FROM school_certificates WHERE school_id = $1`,
      [schoolId]
    );

    const monthlyEnrollments = await pool.query(
      `SELECT DATE_TRUNC('month', enrollment_date) as month, COUNT(*) as count
       FROM school_students
       WHERE school_id = $1
       GROUP BY DATE_TRUNC('month', enrollment_date)
       ORDER BY month DESC
       LIMIT 12`,
      [schoolId]
    );

    res.json({
      analytics: {
        totalStudents: parseInt(totalStudents.rows[0].total),
        activeStudents: parseInt(activeStudents.rows[0].active),
        completedStudents: parseInt(completedStudents.rows[0].completed),
        certificatesIssued: parseInt(certificatesIssued.rows[0].total),
        completionRate: parseInt(totalStudents.rows[0].total) > 0
          ? Math.round((parseInt(completedStudents.rows[0].completed) / parseInt(totalStudents.rows[0].total)) * 100)
          : 0,
        monthlyEnrollments: monthlyEnrollments.rows.map(m => ({
          month: m.month,
          count: parseInt(m.count),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
