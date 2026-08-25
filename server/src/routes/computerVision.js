import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();

// POST /computer-vision/scan-sign - Road sign scanner
router.post('/scan-sign', authenticate, async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    // Mock computer vision result (in production, integrate with vision API)
    const mockSigns = [
      { type: 'speed_limit', value: '60', meaning: 'Maximum speed 60 km/h', action: 'Slow down to 60 km/h or below' },
      { type: 'stop', value: null, meaning: 'Stop sign ahead', action: 'Come to complete stop' },
      { type: 'no_entry', value: null, meaning: 'No entry for vehicles', action: 'Do not enter this road' },
      { type: 'yield', value: null, meaning: 'Give way to traffic', action: 'Slow down and yield' },
      { type: 'pedestrian_crossing', value: null, meaning: 'Pedestrian crossing ahead', action: 'Watch for pedestrians, reduce speed' },
    ];

    const detected = mockSigns[Math.floor(Math.random() * mockSigns.length)];

    res.json({
      scanResult: {
        imageUrl,
        detectedSign: detected,
        confidence: Math.floor(Math.random() * 20) + 80,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) { next(err); }
});

// POST /computer-vision/detect-damage - Vehicle damage detection
router.post('/detect-damage', authenticate, async (req, res, next) => {
  try {
    const { imageUrl } = req.body;

    // Mock damage detection result (in production, integrate with vision API)
    const mockDamages = [
      { area: 'front_bumper', severity: 'minor', type: 'scratch', estimatedCost: 15000 },
      { area: 'rear_door', severity: 'moderate', type: 'dent', estimatedCost: 35000 },
      { area: 'windshield', severity: 'major', type: 'crack', estimatedCost: 75000 },
      { area: 'headlight', severity: 'minor', type: 'broken', estimatedCost: 25000 },
      { area: 'hood', severity: 'moderate', type: 'deformation', estimatedCost: 50000 },
    ];

    const numDamages = Math.floor(Math.random() * 3) + 1;
    const detectedDamages = [];
    let totalCost = 0;

    for (let i = 0; i < numDamages; i++) {
      const damage = mockDamages[Math.floor(Math.random() * mockDamages.length)];
      detectedDamages.push({
        ...damage,
        id: `damage-${i + 1}`,
        confidence: Math.floor(Math.random() * 15) + 85
      });
      totalCost += damage.estimatedCost;
    }

    res.json({
      damageAssessment: {
        imageUrl,
        damages: detectedDamages,
        totalEstimatedCost: totalCost,
        overallSeverity: detectedDamages.some(d => d.severity === 'major') ? 'major' :
                       detectedDamages.some(d => d.severity === 'moderate') ? 'moderate' : 'minor',
        recommendation: totalCost > 50000 ? 'Consider insurance claim' : 'Repair recommended',
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) { next(err); }
});

// GET /computer-vision/scan-history - Get user's scan history
router.get('/scan-history', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    // Mock history data
    const history = [
      { id: 1, type: 'sign', detected: 'Speed Limit 60', date: '2026-05-20', location: 'Lagos-Ibadan Expressway' },
      { id: 2, type: 'damage', detected: 'Front bumper scratch', date: '2026-05-18', location: 'Ikeja, Lagos' },
      { id: 3, type: 'sign', detected: 'Stop Sign', date: '2026-05-15', location: 'Abeokuta Road' },
    ];

    res.json({
      history: type ? history.filter(h => h.type === type) : history
    });
  } catch (err) { next(err); }
});

export default router;
