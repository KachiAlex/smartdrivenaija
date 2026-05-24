import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

router.get('/drivers', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.query;
    const result = await pool.query(
      `SELECT fd.*, u.full_name FROM fleet_drivers fd LEFT JOIN users u ON fd.user_id = u.id WHERE fd.organization_id = $1`,
      [orgId]
    );
    res.json({ drivers: result.rows });
  } catch (err) { next(err); }
});

router.post('/drivers', authenticate, async (req, res, next) => {
  try {
    const { organizationId, employeeId, licenseNumber, licenseExpiry } = req.body;
    const result = await pool.query(
      `INSERT INTO fleet_drivers (organization_id, employee_id, license_number, license_expiry) VALUES ($1, $2, $3, $4) RETURNING *`,
      [organizationId, employeeId, licenseNumber, licenseExpiry]
    );
    res.status(201).json({ driver: result.rows[0] });
  } catch (err) { next(err); }
});

router.get('/compliance', authenticate, async (req, res, next) => {
  try {
    const { orgId } = req.query;
    const result = await pool.query(
      `SELECT fci.*, fd.employee_id FROM fleet_compliance_items fci JOIN fleet_drivers fd ON fci.driver_id = fd.id WHERE fd.organization_id = $1`,
      [orgId]
    );
    res.json({ compliance: result.rows });
  } catch (err) { next(err); }
});

router.get('/certifications', authenticate, async (req, res, next) => {
  try {
    const { driverId } = req.query;
    const result = await pool.query(
      `SELECT * FROM fleet_certifications WHERE driver_id = $1`,
      [driverId]
    );
    res.json({ certifications: result.rows });
  } catch (err) { next(err); }
});

router.post('/certifications', authenticate, async (req, res, next) => {
  try {
    const { driverId, certificateType, issuedDate, expiryDate } = req.body;
    const result = await pool.query(
      `INSERT INTO fleet_certifications (driver_id, certificate_type, issued_date, expiry_date) VALUES ($1, $2, $3, $4) RETURNING *`,
      [driverId, certificateType, issuedDate, expiryDate]
    );
    res.status(201).json({ certification: result.rows[0] });
  } catch (err) { next(err); }
});

export default router;
