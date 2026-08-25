-- Create audio_content table for SmartDrive FM
CREATE TABLE IF NOT EXISTS audio_content (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) NOT NULL, -- 'safety_snippet', 'podcast', 'radio_show'
  audio_url VARCHAR(500),
  duration_seconds INTEGER,
  topic_tag VARCHAR(100),
  language VARCHAR(10) DEFAULT 'en',
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_audio_progress table to track listening progress
CREATE TABLE IF NOT EXISTS user_audio_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_id INTEGER NOT NULL REFERENCES audio_content(id) ON DELETE CASCADE,
  progress_seconds INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  last_played_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE (user_id, audio_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_audio_content_type ON audio_content(content_type);
CREATE INDEX idx_audio_content_topic ON audio_content(topic_tag);
CREATE INDEX idx_audio_content_published ON audio_content(is_published, published_at DESC);
CREATE INDEX idx_audio_content_language ON audio_content(language);
CREATE INDEX idx_user_audio_progress_user_id ON user_audio_progress(user_id);
CREATE INDEX idx_user_audio_progress_audio_id ON user_audio_progress(audio_id);
