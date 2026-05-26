import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

// Get user's rewards
router.get('/my-rewards', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT * FROM rewards 
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY granted_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// Get user's badges
router.get('/my-badges', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT b.*, ub.earned_at
       FROM badges b
       INNER JOIN user_badges ub ON b.id = ub.badge_id
       WHERE ub.user_id = $1
       ORDER BY ub.earned_at DESC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Get all available badges
router.get('/badges', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT b.*, 
        CASE WHEN ub.user_id IS NOT NULL THEN TRUE ELSE FALSE END as earned
       FROM badges b
       LEFT JOIN user_badges ub ON b.id = ub.badge_id AND ub.user_id = $1
       ORDER BY b.requirement_value ASC`,
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching badges:', error);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// Grant reward to user
router.post('/grant', async (req, res) => {
  try {
    const { user_id, reward_type, reward_name, reward_value, source_type, source_id, expires_at } = req.body;
    
    // Grant premium access
    if (reward_type === 'premium_access') {
      const expiryDate = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
      
      await pool.query(
        'UPDATE users SET is_premium = TRUE, premium_expires_at = $1 WHERE id = $2',
        [expiryDate, user_id]
      );
    }
    
    // Grant XP
    if (reward_type === 'xp' && reward_value) {
      await pool.query(
        'UPDATE users SET xp = xp + $1 WHERE id = $2',
        [reward_value, user_id]
      );
    }
    
    // Record reward
    const result = await pool.query(
      `INSERT INTO rewards (user_id, reward_type, reward_name, reward_value, source_type, source_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user_id, reward_type, reward_name, reward_value, source_type, source_id, expires_at]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error granting reward:', error);
    res.status(500).json({ error: 'Failed to grant reward' });
  }
});

// Award badge to user
router.post('/badges/award', async (req, res) => {
  try {
    const { user_id, badge_slug } = req.body;
    
    // Get badge info
    const badgeResult = await pool.query(
      'SELECT * FROM badges WHERE slug = $1',
      [badge_slug]
    );
    
    if (badgeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Badge not found' });
    }
    
    const badge = badgeResult.rows[0];
    
    // Check if user already has badge
    const existingResult = await pool.query(
      'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
      [user_id, badge.id]
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ error: 'User already has this badge' });
    }
    
    // Award badge
    const result = await pool.query(
      `INSERT INTO user_badges (user_id, badge_id)
       VALUES ($1, $2)
       RETURNING *`,
      [user_id, badge.id]
    );
    
    // Grant XP reward if applicable
    if (badge.reward_xp > 0) {
      await pool.query(
        'UPDATE users SET xp = xp + $1 WHERE id = $2',
        [badge.reward_xp, user_id]
      );
      
      // Record XP reward
      await pool.query(
        `INSERT INTO rewards (user_id, reward_type, reward_name, reward_value, source_type, source_id)
         VALUES ($1, 'xp', $2, $3, 'badge', $4)`,
        [user_id, `Badge: ${badge.name}`, badge.reward_xp, badge.id]
      );
    }
    
    res.status(201).json({ 
      badge: badge, 
      user_badge: result.rows[0],
      xp_granted: badge.reward_xp
    });
  } catch (error) {
    console.error('Error awarding badge:', error);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// Check and award badges based on user progress
router.post('/check-badges', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user stats
    const userResult = await pool.query(
      'SELECT xp, streak_current FROM users WHERE id = $1',
      [userId]
    );
    
    const user = userResult.rows[0];
    
    // Get referral count
    const referralResult = await pool.query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1 AND status = $2',
      [userId, 'completed']
    );
    
    const referralCount = parseInt(referralResult.rows[0].count);
    
    // Get module completion
    const moduleResult = await pool.query(
      'SELECT COUNT(DISTINCT module_id) as count FROM progress WHERE user_id = $1 AND status = $2',
      [userId, 'completed']
    );
    
    const moduleCount = parseInt(moduleResult.rows[0].count);
    
    // Get best mock test score
    const scoreResult = await pool.query(
      'SELECT MAX(percentage) as max_score FROM mock_test_history WHERE user_id = $1',
      [userId]
    );
    
    const maxScore = scoreResult.rows[0].max_score || 0;
    
    // Get all badges
    const badgesResult = await pool.query('SELECT * FROM badges');
    const badges = badgesResult.rows;
    
    const awardedBadges = [];
    
    for (const badge of badges) {
      // Check if user already has badge
      const existingResult = await pool.query(
        'SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2',
        [userId, badge.id]
      );
      
      if (existingResult.rows.length > 0) continue;
      
      // Check if user meets requirements
      let meetsRequirement = false;
      
      switch (badge.requirement_type) {
        case 'referrals':
          meetsRequirement = referralCount >= badge.requirement_value;
          break;
        case 'score':
          meetsRequirement = maxScore >= badge.requirement_value;
          break;
        case 'streak':
          meetsRequirement = user.streak_current >= badge.requirement_value;
          break;
        case 'modules':
          meetsRequirement = moduleCount >= badge.requirement_value;
          break;
      }
      
      if (meetsRequirement) {
        // Award badge
        await pool.query(
          `INSERT INTO user_badges (user_id, badge_id)
           VALUES ($1, $2)`,
          [userId, badge.id]
        );
        
        // Grant XP
        if (badge.reward_xp > 0) {
          await pool.query(
            'UPDATE users SET xp = xp + $1 WHERE id = $2',
            [badge.reward_xp, userId]
          );
          
          await pool.query(
            `INSERT INTO rewards (user_id, reward_type, reward_name, reward_value, source_type, source_id)
             VALUES ($1, 'xp', $2, $3, 'badge', $4)`,
            [userId, `Badge: ${badge.name}`, badge.reward_xp, badge.id]
          );
        }
        
        awardedBadges.push(badge);
      }
    }
    
    res.json({ awarded_badges: awardedBadges });
  } catch (error) {
    console.error('Error checking badges:', error);
    res.status(500).json({ error: 'Failed to check badges' });
  }
});

// Check user premium status
router.get('/premium-status', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      'SELECT is_premium, premium_expires_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    const isPremium = user.is_premium && (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());
    
    res.json({
      is_premium: isPremium,
      premium_expires_at: user.premium_expires_at
    });
  } catch (error) {
    console.error('Error checking premium status:', error);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
});

export default router;
