import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// GET /user/profile
router.get('/profile', async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const u = result.rows[0];
    res.json({
      id: u.id,
      phone: u.phone,
      fullName: u.full_name,
      role: u.role,
      preferredLanguage: u.preferred_language,
      isPremium: u.is_premium,
      xpTotal: u.xp_total,
      streakCurrent: u.streak_current,
      streakLongest: u.streak_longest,
      onboardingCompleted: u.onboarding_completed,
      createdAt: u.created_at,
    });
  } catch (err) {
    next(err);
  }
});

// PUT /user/profile
router.put('/profile', async (req, res, next) => {
  try {
    const { fullName, preferredLanguage } = req.body;
    const updates = [];
    const values = [];
    let idx = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(fullName);
    }
    if (preferredLanguage !== undefined) {
      updates.push(`preferred_language = $${idx++}`);
      values.push(preferredLanguage);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    const u = result.rows[0];
    res.json({
      id: u.id,
      phone: u.phone,
      fullName: u.full_name,
      role: u.role,
      preferredLanguage: u.preferred_language,
      isPremium: u.is_premium,
      xpTotal: u.xp_total,
      streakCurrent: u.streak_current,
      streakLongest: u.streak_longest,
      onboardingCompleted: u.onboarding_completed,
    });
  } catch (err) {
    next(err);
  }
});

// POST /user/onboarding-complete
router.post('/onboarding-complete', async (req, res, next) => {
  try {
    const { fullName, preferredLanguage } = req.body;
    await pool.query(
      `UPDATE users SET onboarding_completed = true, full_name = COALESCE($2, full_name), preferred_language = COALESCE($3, preferred_language) WHERE id = $1`,
      [req.user.id, fullName || null, preferredLanguage || null]
    );

    // Initialize module progress for this user
    const modules = await pool.query(`SELECT id, is_free FROM modules ORDER BY sort_order`);
    for (const mod of modules.rows) {
      const lessonCount = await pool.query(
        `SELECT COUNT(*) as count FROM lessons WHERE module_id = $1`, [mod.id]
      );
      await pool.query(
        `INSERT INTO user_module_progress (user_id, module_id, status, total_lessons)
         VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, module_id) DO NOTHING`,
        [req.user.id, mod.id, mod.is_free ? 'available' : 'locked', parseInt(lessonCount.rows[0].count)]
      );
    }

    res.json({ message: 'Onboarding completed' });
  } catch (err) {
    next(err);
  }
});

// GET /user/driver-score
router.get('/driver-score', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const userResult = await pool.query(
      'SELECT xp_total, streak_current, streak_longest FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Get module progress
    const moduleResult = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) as total
       FROM user_module_progress 
       WHERE user_id = $1`,
      [userId]
    );
    
    const moduleData = moduleResult.rows[0];
    const modulesCompleted = parseInt(moduleData.completed);
    const totalModules = parseInt(moduleData.total) || 10;
    
    // Get recent quiz results
    const quizResult = await pool.query(
      `SELECT percentage 
       FROM quiz_history 
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 10`,
      [userId]
    );
    
    const quizzes = quizResult.rows;
    const avgQuizScore = quizzes.length > 0 
      ? quizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) / quizzes.length 
      : 0;
    
    // Calculate Smart Driver Score
    const moduleScore = Math.min((modulesCompleted / totalModules) * 40, 40); // Max 40 points
    const quizScore = Math.min((avgQuizScore / 100) * 30, 30); // Max 30 points
    const streakScore = Math.min((user.streak_current || 0) * 2, 20); // Max 20 points (10 day streak)
    const xpScore = Math.min((user.xp_total || 0) / 100, 10); // Max 10 points (1000 XP)
    
    const driverScore = Math.round(moduleScore + quizScore + streakScore + xpScore);
    
    res.json({
      driverScore,
      scoreBreakdown: {
        modules: Math.round(moduleScore),
        quizzes: Math.round(quizScore),
        streak: Math.round(streakScore),
        xp: Math.round(xpScore)
      },
      details: {
        modulesCompleted,
        totalModules,
        avgQuizScore: Math.round(avgQuizScore),
        streakCurrent: user.streak_current || 0,
        xpTotal: user.xp_total || 0
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /user/weaknesses - Get user's learning weaknesses
router.get('/weaknesses', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT topic_tag, weakness_level, incorrect_count, total_attempts, 
             last_assessed_at, recommended_lesson_ids
      FROM user_weaknesses
      WHERE user_id = $1
      ORDER BY 
        CASE weakness_level
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        incorrect_count DESC
    `, [userId]);

    res.json({
      weaknesses: result.rows.map(w => ({
        topicTag: w.topic_tag,
        weaknessLevel: w.weakness_level,
        incorrectCount: w.incorrect_count,
        totalAttempts: w.total_attempts,
        lastAssessedAt: w.last_assessed_at,
        recommendedLessonIds: w.recommended_lesson_ids,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /user/recommendations - Get personalized study recommendations
router.get('/recommendations', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT id, recommendation_type, content, priority, is_completed, 
             created_at, completed_at
      FROM study_recommendations
      WHERE user_id = $1 AND is_completed = FALSE
      ORDER BY priority ASC, created_at DESC
      LIMIT 10
    `, [userId]);

    res.json({
      recommendations: result.rows.map(r => ({
        id: r.id,
        type: r.recommendation_type,
        content: r.content,
        priority: r.priority,
        isCompleted: r.is_completed,
        createdAt: r.created_at,
        completedAt: r.completed_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// POST /user/recommendations/:id/complete - Mark recommendation as completed
router.post('/recommendations/:id/complete', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const recommendationId = parseInt(req.params.id);

    const result = await pool.query(
      `UPDATE study_recommendations
       SET is_completed = TRUE, completed_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, recommendation_type, content`,
      [recommendationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recommendation not found' });
    }

    res.json({
      recommendation: {
        id: result.rows[0].id,
        type: result.rows[0].recommendation_type,
        content: result.rows[0].content,
        isCompleted: true,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /user/readiness - Get driver readiness prediction
router.get('/readiness', async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get user performance data
    const userResult = await pool.query(`SELECT * FROM users WHERE id = $1`, [userId]);
    const user = userResult.rows[0];

    const modulesResult = await pool.query(
      `SELECT COUNT(*) as completed FROM user_module_progress WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    const modulesCompleted = parseInt(modulesResult.rows[0].completed);

    const totalModulesResult = await pool.query(`SELECT COUNT(*) as total FROM modules`, []);
    const totalModules = parseInt(totalModulesResult.rows[0].total);

    const quizResult = await pool.query(
      `SELECT AVG(percentage) as avg_score FROM quiz_history WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '30 days'`,
      [userId]
    );
    const avgQuizScore = quizResult.rows[0].avg_score || 0;

    const weaknessResult = await pool.query(
      `SELECT COUNT(*) as critical_weaknesses FROM user_weaknesses WHERE user_id = $1 AND weakness_level = 'critical'`,
      [userId]
    );
    const criticalWeaknesses = parseInt(weaknessResult.rows[0].critical_weaknesses);

    // Calculate pass probability based on multiple factors
    const moduleProgress = modulesCompleted / totalModules; // 0-1
    const quizPerformance = avgQuizScore / 100; // 0-1
    const streakFactor = Math.min((user.streak_current || 0) / 14, 1); // 0-1 (14 day streak max)
    const weaknessPenalty = Math.min(criticalWeaknesses * 0.1, 0.5); // Max 50% penalty

    // Weighted calculation
    const passProbability = Math.round(
      (moduleProgress * 0.4 + quizPerformance * 0.4 + streakFactor * 0.2) * 100 - (weaknessPenalty * 100)
    );
    const clampedProbability = Math.max(0, Math.min(100, passProbability));

    // Determine readiness level
    let readinessLevel = 'Not Ready';
    if (clampedProbability >= 80) readinessLevel = 'Ready';
    else if (clampedProbability >= 60) readinessLevel = 'Almost Ready';
    else if (clampedProbability >= 40) readinessLevel = 'Needs Improvement';

    // Generate recommendations
    const recommendations = [];
    if (moduleProgress < 0.8) {
      recommendations.push('Complete more modules to improve your knowledge base');
    }
    if (quizPerformance < 0.7) {
      recommendations.push('Practice more quizzes to improve your test-taking skills');
    }
    if (criticalWeaknesses > 0) {
      recommendations.push(`Focus on your ${criticalWeaknesses} critical weakness areas`);
    }
    if (streakFactor < 0.5) {
      recommendations.push('Maintain a consistent learning streak to build retention');
    }

    res.json({
      passProbability: clampedProbability,
      readinessLevel,
      factors: {
        moduleProgress: Math.round(moduleProgress * 100),
        quizPerformance: Math.round(quizPerformance * 100),
        streakFactor: Math.round(streakFactor * 100),
        weaknessPenalty: Math.round(weaknessPenalty * 100),
      },
      details: {
        modulesCompleted,
        totalModules,
        avgQuizScore: Math.round(avgQuizScore),
        streakCurrent: user.streak_current || 0,
        criticalWeaknesses,
      },
      recommendations,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
