import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// Report hazard
router.post('/', async (req, res) => {
  try {
    const { user_id, hazard_type, description, latitude, longitude, location_address, image_url, severity } = req.body;
    const result = await pool.query(
      `INSERT INTO hazards (user_id, hazard_type, description, latitude, longitude, location_address, image_url, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [user_id, hazard_type, description, latitude, longitude, location_address, image_url, severity || 'medium']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error reporting hazard:', error);
    res.status(500).json({ error: 'Failed to report hazard' });
  }
});

// Get active hazards
router.get('/', async (req, res) => {
  try {
    const { hazard_type, severity } = req.query;
    let query = `SELECT h.*, u.full_name as reporter_name FROM hazards h LEFT JOIN users u ON h.user_id = u.id WHERE h.status = 'active' AND h.expires_at > CURRENT_TIMESTAMP`;
    const params = [];
    let paramCount = 0;
    
    if (hazard_type) { paramCount++; query += ` AND h.hazard_type = $${paramCount}`; params.push(hazard_type); }
    if (severity) { paramCount++; query += ` AND h.severity = $${paramCount}`; params.push(severity); }
    
    query += ` ORDER BY h.reported_at DESC LIMIT 100`;
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching hazards:', error);
    res.status(500).json({ error: 'Failed to fetch hazards' });
  }
});

// Vote on hazard
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, vote_type } = req.body;
    
    await pool.query(
      `INSERT INTO hazard_votes (hazard_id, user_id, vote_type) VALUES ($1, $2, $3) ON CONFLICT (hazard_id, user_id) DO UPDATE SET vote_type = $3`,
      [id, user_id, vote_type]
    );
    
    const updateResult = await pool.query(
      `UPDATE hazards SET ${vote_type === 'upvote' ? 'upvotes' : 'downvotes'} = ${vote_type === 'upvote' ? 'upvotes' : 'downvotes'} + 1 WHERE id = $1 RETURNING *`,
      [id]
    );
    
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error voting on hazard:', error);
    res.status(500).json({ error: 'Failed to vote on hazard' });
  }
});

// Resolve hazard
router.put('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE hazards SET status = 'resolved', resolved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error resolving hazard:', error);
    res.status(500).json({ error: 'Failed to resolve hazard' });
  }
});

export default router;
