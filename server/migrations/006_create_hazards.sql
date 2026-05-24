-- Create hazards table for hazard reporting system
CREATE TABLE IF NOT EXISTS hazards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  hazard_type VARCHAR(50) NOT NULL, -- 'pothole', 'accident', 'construction', 'flood', 'debris', 'other'
  description TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_address VARCHAR(255),
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'resolved', 'expired'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '48 hours'),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX idx_hazards_user_id ON hazards(user_id);
CREATE INDEX idx_hazards_status ON hazards(status);
CREATE INDEX idx_hazards_hazard_type ON hazards(hazard_type);
CREATE INDEX idx_hazards_location ON hazards(latitude, longitude);
CREATE INDEX idx_hazards_expires_at ON hazards(expires_at);
CREATE INDEX idx_hazards_reported_at ON hazards(reported_at);

-- Create hazard votes table
CREATE TABLE IF NOT EXISTS hazard_votes (
  id SERIAL PRIMARY KEY,
  hazard_id INTEGER NOT NULL REFERENCES hazards(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL, -- 'upvote', 'downvote'
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (hazard_id, user_id)
);

-- Create index for hazard votes
CREATE INDEX idx_hazard_votes_hazard_id ON hazard_votes(hazard_id);
CREATE INDEX idx_hazard_votes_user_id ON hazard_votes(user_id);
CREATE INDEX idx_hazard_votes_vote_type ON hazard_votes(vote_type);
