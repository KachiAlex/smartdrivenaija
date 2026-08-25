-- Create parent_guardian_links table for linking parents to students
CREATE TABLE IF NOT EXISTS parent_guardian_links (
  id SERIAL PRIMARY KEY,
  parent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship VARCHAR(50), -- 'parent', 'guardian', 'sibling', 'other'
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (parent_user_id, student_user_id)
);

-- Create guardian_alerts table for readiness and progress alerts
CREATE TABLE IF NOT EXISTS guardian_alerts (
  id SERIAL PRIMARY KEY,
  parent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'readiness', 'milestone', 'concern', 'achievement'
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create premium_sponsorships table for tracking premium subscriptions gifted by guardians
CREATE TABLE IF NOT EXISTS premium_sponsorships (
  id SERIAL PRIMARY KEY,
  sponsor_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  beneficiary_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type VARCHAR(50) NOT NULL,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_parent_guardian_links_parent ON parent_guardian_links(parent_user_id);
CREATE INDEX idx_parent_guardian_links_student ON parent_guardian_links(student_user_id);
CREATE INDEX idx_guardian_alerts_parent ON guardian_alerts(parent_user_id);
CREATE INDEX idx_guardian_alerts_unread ON guardian_alerts(parent_user_id, is_read);
CREATE INDEX idx_premium_sponsorships_sponsor ON premium_sponsorships(sponsor_user_id);
CREATE INDEX idx_premium_sponsorships_beneficiary ON premium_sponsorships(beneficiary_user_id);
