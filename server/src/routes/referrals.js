const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get user's referral code and stats
router.get('/my-referral', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's referral code
    const userResult = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get referral stats
    const statsResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending_referrals,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_referrals,
        COUNT(*) FILTER (WHERE status = 'rewarded') as rewarded_referrals
       FROM referrals 
       WHERE referrer_id = $1`,
      [userId]
    );
    
    // Get recent referrals
    const referralsResult = await pool.query(
      `SELECT r.*, u.name as referred_user_name
       FROM referrals r
       LEFT JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [userId]
    );
    
    res.json({
      referral_code: userResult.rows[0].referral_code,
      stats: statsResult.rows[0],
      recent_referrals: referralsResult.rows
    });
  } catch (error) {
    console.error('Error fetching referral info:', error);
    res.status(500).json({ error: 'Failed to fetch referral info' });
  }
});

// Validate referral code during registration
router.post('/validate', async (req, res) => {
  try {
    const { referral_code } = req.body;
    
    if (!referral_code) {
      return res.status(400).json({ error: 'Referral code is required' });
    }
    
    const result = await pool.query(
      'SELECT id, name FROM users WHERE referral_code = $1',
      [referral_code]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    res.json({ 
      valid: true, 
      referrer: { id: result.rows[0].id, name: result.rows[0].name } 
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ error: 'Failed to validate referral code' });
  }
});

// Create referral (called after new user registration)
router.post('/create', async (req, res) => {
  try {
    const { referrer_id, referred_user_id, referral_code } = req.body;
    
    // Check if referral already exists
    const existingResult = await pool.query(
      'SELECT id FROM referrals WHERE referrer_id = $1 AND referred_user_id = $2',
      [referrer_id, referred_user_id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'Referral already exists' });
    }
    
    const result = await pool.query(
      `INSERT INTO referrals (referrer_id, referred_user_id, referral_code, status)
       VALUES ($1, $2, $3, 'completed')
       RETURNING *`,
      [referrer_id, referred_user_id, referral_code]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating referral:', error);
    res.status(500).json({ error: 'Failed to create referral' });
  }
});

// Grant reward for referral
router.put('/:id/grant-reward', async (req, res) => {
  try {
    const { id } = req.params;
    const { reward_type } = req.body;
    
    const result = await pool.query(
      `UPDATE referrals 
       SET status = 'rewarded', reward_type = $2, reward_granted = TRUE, completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reward_type]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }
    
    // Grant XP reward if applicable
    if (reward_type === 'xp') {
      await pool.query(
        'UPDATE users SET xp = xp + 100 WHERE id = (SELECT referrer_id FROM referrals WHERE id = $1)',
        [id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error granting reward:', error);
    res.status(500).json({ error: 'Failed to grant reward' });
  }
});

// Get referral leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        u.id, 
        u.name, 
        u.xp,
        COUNT(r.id) as total_referrals,
        COUNT(r.id) FILTER (WHERE r.status = 'completed') as completed_referrals
       FROM users u
       LEFT JOIN referrals r ON u.id = r.referrer_id
       GROUP BY u.id, u.name, u.xp
       ORDER BY total_referrals DESC, completed_referrals DESC
       LIMIT 20`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching referral leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;
