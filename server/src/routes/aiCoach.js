import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import pool from '../db/pool.js';

const router = Router();
router.use(authenticate);

// POST /ai-coach/chat - Send message to AI coach and get response
router.post('/chat', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { message, sessionId, messageType = 'text', language = 'en', contextData } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Generate AI response (placeholder - in production, integrate with actual AI service)
    const aiResponse = await generateAIResponse(message, language, contextData);

    // Store conversation
    const result = await pool.query(
      `INSERT INTO ai_coach_conversations (user_id, session_id, message, response, message_type, language, context_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, created_at`,
      [userId, sessionId || generateSessionId(), message, aiResponse, messageType, language, JSON.stringify(contextData || {})]
    );

    res.json({
      id: result.rows[0].id,
      sessionId: sessionId || generateSessionId(),
      message,
      response: aiResponse,
      messageType,
      language,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    next(err);
  }
});

// GET /ai-coach/conversations - Get conversation history
router.get('/conversations', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId, limit = 20 } = req.query;

    let query = `
      SELECT id, session_id, message, response, message_type, language, context_data, created_at
      FROM ai_coach_conversations
      WHERE user_id = $1
    `;
    const params = [userId];
    let paramCount = 1;

    if (sessionId) {
      paramCount++;
      query += ` AND session_id = $${paramCount}`;
      params.push(sessionId);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
    params.push(parseInt(limit));

    const result = await pool.query(query, params);

    res.json({
      conversations: result.rows.map(c => ({
        id: c.id,
        sessionId: c.session_id,
        message: c.message,
        response: c.response,
        messageType: c.message_type,
        language: c.language,
        contextData: c.context_data,
        createdAt: c.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// GET /ai-coach/sessions - Get all chat sessions for user
router.get('/sessions', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT session_id, COUNT(*) as message_count, 
             MAX(created_at) as last_message_at,
             MIN(created_at) as first_message_at
      FROM ai_coach_conversations
      WHERE user_id = $1
      GROUP BY session_id
      ORDER BY last_message_at DESC
    `, [userId]);

    res.json({
      sessions: result.rows.map(s => ({
        sessionId: s.session_id,
        messageCount: parseInt(s.message_count),
        lastMessageAt: s.last_message_at,
        firstMessageAt: s.first_message_at,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /ai-coach/sessions/:sessionId - Delete a conversation session
router.delete('/sessions/:sessionId', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const result = await pool.query(
      `DELETE FROM ai_coach_conversations 
       WHERE user_id = $1 AND session_id = $2
       RETURNING id`,
      [userId, sessionId]
    );

    res.json({ 
      deleted: result.rowCount,
      message: result.rowCount > 0 ? 'Session deleted successfully' : 'Session not found' 
    });
  } catch (err) {
    next(err);
  }
});

// Helper function to generate session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Placeholder AI response generator (in production, integrate with actual AI service)
async function generateAIResponse(message, language, contextData) {
  // This is a placeholder implementation
  // In production, this would call an AI service like OpenAI, Anthropic, or a local model
  
  const responses = {
    en: [
      "That's a great question about traffic safety! According to Nigerian traffic laws, you should always yield to pedestrians at marked crossings.",
      "I'd be happy to help you understand that traffic sign. It indicates a mandatory direction that all drivers must follow.",
      "Remember, safety comes first. Always maintain a safe following distance of at least 2 seconds from the vehicle ahead.",
      "Good question! The speed limit in built-up areas in Nigeria is 50 km/h unless otherwise indicated by signs.",
    ],
    ha: [
      "Na tambaya mai kyau game da tsaro! Bisa ga dokokin hanyoyi, kada ka ba damar masu tafiya a wurin wucewa.",
      "Ina so in taimake ka a fahimtar wannan alamar. Tana nuna hanya da duk direkobi su bi.",
      "Ka tuna, tsaro shine na farko. Ka raba mai gaba da kiman dakika 2.",
    ],
    yo: [
      "Ìbéèrè tó ṣe! Nípa ofin ọkọ̀ ayọ́kẹ́lẹ́ Nàìjíríà, o gbọ́dọ̀ fi àwọn arìnrìn-àjò sílẹ̀ ní àyẹ̀kẹ́.",
      "Mo nife ẹ kọ́ ẹ̀kọ́ nipa àmì yìí. Ó ń ṣalaye ọ̀nà gbogbo ọkọ̀ ayọ́kẹ́lẹ́ gbọ́dọ̀ gbà.",
      "Rántí àìlera, aṣẹ̀ àìlera ni àkọ́kọ́. Fi àwọn ọkọ̀ tí o wà níwájú sílẹ̀.",
    ],
    ig: [
      "Nke a bụ ajụjụ dị mma! Dịka iwu okporo ụzọ Naịjirịa, kwesịrị ịnye ndị na-agagharị agagharị ohere n'ụzọ agafe.",
      "Achọrọ m inyere gị aka ịghọta ihe a na-egosi. Ọ na-egosi ụzọ ndị ọkwọ ala niile ga-agba.",
      "Cheta nchekwa bụ nke mbụ. Nwee oge nke dịkarịa sekọnd abụọ site n'ụgbọ gị n'ihu.",
    ],
    pidgin: [
      "Correct question! For Nigeria traffic law, you must always give way to people wey dey cross road.",
      "I go help you understand this sign wella. E dey show direction wey all drivers must follow.",
      "Remember, safety first. Always maintain good distance from the car wey dey front of you.",
    ],
  };

  const langResponses = responses[language] || responses.en;
  const randomResponse = langResponses[Math.floor(Math.random() * langResponses.length)];
  
  // Add context-aware response if contextData is provided
  if (contextData?.topic) {
    return `${randomResponse} Regarding ${contextData.topic}, let me explain further...`;
  }
  
  return randomResponse;
}

export default router;
