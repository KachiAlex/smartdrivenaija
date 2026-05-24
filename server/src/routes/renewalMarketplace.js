import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// GET /renewal/providers - List service providers
router.get('/providers', authenticate, async (req, res, next) => {
  try {
    const { type } = req.query;

    const providers = [
      { id: 1, name: 'FRSC Lagos Office', type: 'license', address: 'Ojodu, Lagos', available: true },
      { id: 2, name: 'Vehicle Inspection Office Ikeja', type: 'inspection', address: 'Ikeja, Lagos', available: true },
      { id: 3, name: 'AXA Mansard Insurance', type: 'insurance', address: 'Victoria Island, Lagos', available: true },
      { id: 4, name: 'Leadway Assurance', type: 'insurance', address: 'Ikeja, Lagos', available: true },
      { id: 5, name: 'FRSC Abuja Office', type: 'license', address: 'Wuse, Abuja', available: true },
    ];

    res.json({
      providers: type ? providers.filter(p => p.type === type) : providers
    });
  } catch (err) { next(err); }
});

// POST /renewal/book - Create booking
router.post('/book', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bookingType, providerName, providerAddress, appointmentDate, notes } = req.body;

    const referenceNumber = `SDN-RNW-${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO renewal_bookings (user_id, booking_type, provider_name, provider_address, appointment_date, reference_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [userId, bookingType, providerName, providerAddress, appointmentDate, referenceNumber, notes]
    );

    res.status(201).json({
      booking: {
        id: result.rows[0].id,
        type: result.rows[0].booking_type,
        provider: result.rows[0].provider_name,
        appointmentDate: result.rows[0].appointment_date,
        referenceNumber: result.rows[0].reference_number,
        status: result.rows[0].status
      }
    });
  } catch (err) { next(err); }
});

// GET /renewal/bookings - List user bookings
router.get('/bookings', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM renewal_bookings WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      bookings: result.rows.map(b => ({
        id: b.id,
        type: b.booking_type,
        provider: b.provider_name,
        address: b.provider_address,
        appointmentDate: b.appointment_date,
        status: b.status,
        referenceNumber: b.reference_number
      }))
    });
  } catch (err) { next(err); }
});

// PUT /renewal/bookings/:id/cancel - Cancel booking
router.put('/bookings/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const bookingId = parseInt(req.params.id);

    await pool.query(
      `UPDATE renewal_bookings SET status = 'cancelled' WHERE id = $1 AND user_id = $2`,
      [bookingId, userId]
    );

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
