-- Create reminders table for compliance notifications
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_id INTEGER REFERENCES driver_documents(id) ON DELETE CASCADE,
  reminder_type VARCHAR(50) NOT NULL, -- 'expiry', 'compliance'
  days_before_expiry INTEGER,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster lookups
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_is_read ON reminders(is_read);
CREATE INDEX idx_reminders_created_at ON reminders(created_at);

-- Trigger to update updated_at (if we add that column later)
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- If we add updated_at column, update it here
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
