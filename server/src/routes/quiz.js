import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { updateStreak } from './progress.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// GET /quiz/:moduleId — get quiz questions for a module
router.get('/:moduleId', async (req, res, next) => {
  try {
    const moduleId = parseInt(req.params.moduleId);
    const limit = parseInt(req.query.limit) || 10;

    const questions = await pool.query(`
      SELECT id, topic_tag, question_en as question, options_en as options, difficulty
      FROM questions
      WHERE module_id = $1
      ORDER BY RANDOM()
      LIMIT $2
    `, [moduleId, limit]);

    res.json({
      moduleId,
      questions: questions.rows.map(q => ({
        id: q.id,
        topicTag: q.topic_tag,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
      })),
      totalQuestions: questions.rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /quiz/:moduleId/submit — submit quiz answers
router.post('/:moduleId/submit', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const moduleId = parseInt(req.params.moduleId);
    const { answers, lessonId, startedAt } = req.body;
    // answers: [{questionId, selected}]

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Answers array required' });
    }

    // Fetch correct answers
    const questionIds = answers.map(a => a.questionId);
    const questionsResult = await pool.query(
      `SELECT id, correct_answer, topic_tag, explanation_en FROM questions WHERE id = ANY($1)`,
      [questionIds]
    );

    const questionMap = {};
    for (const q of questionsResult.rows) {
      questionMap[q.id] = q;
    }

    // Score
    let score = 0;
    const gradedAnswers = answers.map(a => {
      const q = questionMap[a.questionId];
      const correct = q ? a.selected === q.correct_answer : false;
      if (correct) score++;
      return {
        question_id: a.questionId,
        selected: a.selected,
        correct,
        topic_tag: q?.topic_tag,
        time_ms: a.timeMs || 0,
        explanation: q?.explanation_en,
      };
    });

    const totalQuestions = answers.length;
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= 70;
    const xpEarned = passed ? Math.round(score * 15) : Math.round(score * 5);

    // Store attempt
    const attempt = await pool.query(`
      INSERT INTO quiz_attempts (user_id, module_id, lesson_id, score, total_questions, percentage, passed, xp_earned, answers, started_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [userId, moduleId, lessonId || null, score, totalQuestions, percentage, passed, xpEarned, JSON.stringify(gradedAnswers), startedAt || new Date()]);

    // Award XP
    await pool.query(
      `INSERT INTO xp_ledger (user_id, amount, source, reference_id, description)
       VALUES ($1, $2, 'quiz', $3, $4)`,
      [userId, xpEarned, attempt.rows[0].id, `Quiz: ${score}/${totalQuestions} (${Math.round(percentage)}%)`]
    );
    await pool.query(`UPDATE users SET xp_total = xp_total + $1 WHERE id = $2`, [xpEarned, userId]);

    // Update streak
    await updateStreak(userId);

    // Log analytics (topic-tagged for V2 AI training)
    for (const a of gradedAnswers) {
      await pool.query(
        `INSERT INTO analytics_events (user_id, event_type, event_data)
         VALUES ($1, 'quiz_answer', $2)`,
        [userId, JSON.stringify({
          questionId: a.question_id,
          topicTag: a.topic_tag,
          selected: a.selected,
          correct: a.correct,
          timeMs: a.time_ms,
          moduleId,
        })]
      );
    }

    // Check badges
    await checkQuizBadges(userId, percentage, score, totalQuestions);

    res.json({
      attemptId: attempt.rows[0].id,
      score,
      totalQuestions,
      percentage: Math.round(percentage),
      passed,
      xpEarned,
      answers: gradedAnswers,
    });
  } catch (err) {
    next(err);
  }
});

async function checkQuizBadges(userId, percentage, score, total) {
  // First quiz badge
  const quizCount = await pool.query(
    `SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1`, [userId]
  );
  if (parseInt(quizCount.rows[0].count) === 1) {
    const badge = await pool.query(`SELECT id FROM badges WHERE slug = 'first_quiz'`);
    if (badge.rows[0]) {
      await pool.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, badge.rows[0].id]
      );
    }
  }

  // Perfect score badge
  if (score === total && total > 0) {
    const badge = await pool.query(`SELECT id FROM badges WHERE slug = 'perfect_score'`);
    if (badge.rows[0]) {
      await pool.query(
        `INSERT INTO user_badges (user_id, badge_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [userId, badge.rows[0].id]
      );
    }
  }
}

export default router;
