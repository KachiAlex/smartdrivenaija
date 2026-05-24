-- Create ai_coach_conversations table for storing AI chat history
CREATE TABLE IF NOT EXISTS ai_coach_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice'
  language VARCHAR(10) DEFAULT 'en', -- 'en', 'ha', 'yo', 'ig', 'pidgin'
  context_data JSONB, -- Store additional context like topic, difficulty, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for efficient queries
CREATE INDEX idx_ai_coach_user_id ON ai_coach_conversations(user_id);
CREATE INDEX idx_ai_coach_session_id ON ai_coach_conversations(session_id);
CREATE INDEX idx_ai_coach_created_at ON ai_coach_conversations(created_at DESC);
CREATE INDEX idx_ai_coach_language ON ai_coach_conversations(language);
