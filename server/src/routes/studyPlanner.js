import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// POST /study-planner/schedules - Create a new study schedule
router.post('/schedules', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { scheduleName, goalType, targetDate, dailyStudyMinutes = 30 } = req.body;

    if (!scheduleName || !goalType) {
      return res.status(400).json({ error: 'Schedule name and goal type are required' });
    }

    // Generate AI-based schedule (placeholder - in production, integrate with AI service)
    const scheduleData = generateStudySchedule(goalType, dailyStudyMinutes, targetDate);

    const result = await pool.query(
      `INSERT INTO study_schedules (user_id, schedule_name, goal_type, target_date, daily_study_minutes, schedule_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, scheduleName, goalType, targetDate || null, dailyStudyMinutes, JSON.stringify(scheduleData)]
    );

    // Create initial study progress entries
    if (targetDate) {
      const startDate = new Date();
      const endDate = new Date(targetDate);
      const daysToPlan = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      
      for (let i = 0; i < Math.min(daysToPlan, 30); i++) {
        const studyDate = new Date(startDate);
        studyDate.setDate(studyDate.getDate() + i);
        
        await pool.query(
          `INSERT INTO study_progress (user_id, schedule_id, study_date, planned_minutes)
           VALUES ($1, $2, $3, $4)`,
          [userId, result.rows[0].id, studyDate, dailyStudyMinutes]
        );
      }
    }

    res.status(201).json({
      schedule: {
        id: result.rows[0].id,
        scheduleName: result.rows[0].schedule_name,
        goalType: result.rows[0].goal_type,
        targetDate: result.rows[0].target_date,
        dailyStudyMinutes: result.rows[0].daily_study_minutes,
        scheduleData: result.rows[0].schedule_data,
        isActive: result.rows[0].is_active,
        createdAt: result.rows[0].created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /study-planner/schedules - Get user's study schedules
router.get('/schedules', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT * FROM study_schedules WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      schedules: result.rows.map(s => ({
        id: s.id,
        scheduleName: s.schedule_name,
        goalType: s.goal_type,
        targetDate: s.target_date,
        dailyStudyMinutes: s.daily_study_minutes,
        scheduleData: s.schedule_data,
        isActive: s.is_active,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /study-planner/schedules/:id/progress - Get progress for a specific schedule
router.get('/schedules/:id/progress', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const scheduleId = parseInt(req.params.id);

    const result = await pool.query(
      `SELECT sp.*, ss.schedule_name 
       FROM study_progress sp
       JOIN study_schedules ss ON sp.schedule_id = ss.id
       WHERE sp.user_id = $1 AND sp.schedule_id = $2
       ORDER BY sp.study_date ASC`,
      [userId, scheduleId]
    );

    const totalPlanned = result.rows.reduce((sum, row) => sum + row.planned_minutes, 0);
    const totalActual = result.rows.reduce((sum, row) => sum + row.actual_minutes, 0);
    const completionRate = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;

    res.json({
      scheduleId,
      progress: result.rows.map(p => ({
        id: p.id,
        studyDate: p.study_date,
        plannedMinutes: p.planned_minutes,
        actualMinutes: p.actual_minutes,
        lessonsCompleted: p.lessons_completed,
        quizzesCompleted: p.quizzes_completed,
        isCompleted: p.is_completed,
      })),
      summary: {
        totalPlannedMinutes: totalPlanned,
        totalActualMinutes: totalActual,
        completionRate,
        totalDays: result.rows.length,
        completedDays: result.rows.filter(r => r.is_completed).length,
      },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /study-planner/progress/:id - Update daily study progress
router.put('/progress/:id', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const progressId = parseInt(req.params.id);
    const { actualMinutes, lessonsCompleted, quizzesCompleted, isCompleted } = req.body;

    const result = await pool.query(
      `UPDATE study_progress
       SET actual_minutes = COALESCE($1, actual_minutes),
           lessons_completed = COALESCE($2, lessons_completed),
           quizzes_completed = COALESCE($3, quizzes_completed),
           is_completed = COALESCE($4, is_completed)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [actualMinutes, lessonsCompleted, quizzesCompleted, isCompleted, progressId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Progress entry not found' });
    }

    res.json({
      progress: {
        id: result.rows[0].id,
        studyDate: result.rows[0].study_date,
        plannedMinutes: result.rows[0].planned_minutes,
        actualMinutes: result.rows[0].actual_minutes,
        lessonsCompleted: result.rows[0].lessons_completed,
        quizzesCompleted: result.rows[0].quizzes_completed,
        isCompleted: result.rows[0].is_completed,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Helper function to generate study schedule (placeholder)
function generateStudySchedule(goalType, dailyMinutes, targetDate) {
  const days = targetDate ? Math.ceil((new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : 30;
  const schedule = {
    totalDays: days,
    dailyMinutes,
    weeklyPlan: [],
    focusAreas: [],
  };

  // Generate weekly plan
  for (let week = 0; week < Math.ceil(days / 7); week++) {
    schedule.weeklyPlan.push({
      week: week + 1,
      modules: ['traffic_signs', 'right_of_way', 'speed_limits'].slice(week % 3),
      quizzes: 5,
      review: week > 0,
    });
  }

  // Set focus areas based on goal type
  if (goalType === 'exam_prep') {
    schedule.focusAreas = ['all_topics', 'mock_tests', 'time_management'];
  } else if (goalType === 'improvement') {
    schedule.focusAreas = ['weaknesses', 'practice_quizzes', 'review'];
  } else {
    schedule.focusAreas = ['key_concepts', 'quick_reviews', 'safety_tips'];
  }

  return schedule;
}

export default router;
