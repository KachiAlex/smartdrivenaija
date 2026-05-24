import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// POST /route-intelligence/safe-route - Safe route recommendations
router.post('/safe-route', authenticate, async (req, res, next) => {
  try {
    const { origin, destination, avoidHazards = true } = req.body;

    // Get hazard hotspots along the route area
    const hazards = await pool.query(`
      SELECT latitude, longitude, hazard_type, severity
      FROM hazard_reports
      WHERE reported_at > NOW() - INTERVAL '48 hours'
      AND is_active = TRUE
    `);

    // Mock safe route calculation (in production, integrate with mapping API)
    const route = {
      origin,
      destination,
      distance: '12.5 km',
      duration: '28 mins',
      safetyScore: 85,
      avoidHazards,
      warnings: hazards.rows.slice(0, 3).map(h => ({
        location: { lat: h.latitude, lng: h.longitude },
        type: h.hazard_type,
        severity: h.severity,
        message: `Caution: ${h.hazard_type} reported in this area`
      }))
    };

    res.json({ route });
  } catch (err) { next(err); }
});

// GET /route-intelligence/risk-warnings - Risk warnings for a location
router.get('/risk-warnings', authenticate, async (req, res, next) => {
  try {
    const { lat, lng, radius = 5 } = req.query;

    // Find nearby active hazards
    const hazards = await pool.query(`
      SELECT *,
             (6371 * acos(cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude)))) as distance
      FROM hazard_reports
      WHERE reported_at > NOW() - INTERVAL '48 hours'
      AND is_active = TRUE
      HAVING (6371 * acos(cos(radians($1)) * cos(radians(latitude)) *
              cos(radians(longitude) - radians($2)) +
              sin(radians($1)) * sin(radians(latitude)))) < $3
      ORDER BY distance
    `, [lat, lng, radius]);

    res.json({
      location: { lat, lng },
      radius: `${radius}km`,
      warnings: hazards.rows.map(h => ({
        id: h.id,
        type: h.hazard_type,
        severity: h.severity,
        description: h.description,
        distance: `${h.distance.toFixed(2)} km`,
        reportedAt: h.reported_at
      })),
      overallRisk: hazards.rows.length > 5 ? 'high' : hazards.rows.length > 0 ? 'medium' : 'low'
    });
  } catch (err) { next(err); }
});

// POST /route-intelligence/travel-plan - Travel planning
router.post('/travel-plan', authenticate, async (req, res, next) => {
  try {
    const { origin, destination, departureTime, preferences = {} } = req.body;

    // Analyze time-based risk patterns
    const hour = new Date(departureTime).getHours();
    const timeRisk = await pool.query(`
      SELECT AVG(severity) as avg_risk
      FROM hazard_reports
      WHERE EXTRACT(HOUR FROM reported_at) BETWEEN $1 AND $2
    `, [hour - 1, hour + 1]);

    const plan = {
      origin,
      destination,
      departureTime,
      estimatedArrival: new Date(new Date(departureTime).getTime() + 30 * 60000).toISOString(),
      recommendations: [
        timeRisk.rows[0].avg_risk > 3 ? 'Avoid this travel time - higher incident reports' : 'Good travel time',
        'Check weather conditions before departure',
        'Ensure vehicle documents are valid'
      ],
      checkpoints: [
        { name: 'Toll Gate A', distance: '5 km', restStop: false },
        { name: 'Rest Area B', distance: '8 km', restStop: true },
        { name: 'Police Checkpoint C', distance: '12 km', restStop: false }
      ]
    };

    res.json({ plan });
  } catch (err) { next(err); }
});

export default router;
