-- Create anonymous_trend_reports table
CREATE TABLE IF NOT EXISTS anonymous_trend_reports (
  id SERIAL PRIMARY KEY,
  report_type VARCHAR(50) NOT NULL, -- 'safety_concern', 'violation', 'infrastructure'
  category VARCHAR(100),
  description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  severity INTEGER CHECK (severity >= 1 AND severity <= 5),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add preferred_language to users if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferred_language') THEN
    ALTER TABLE users ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'en';
  END IF;
END $$;

-- Create indexes
CREATE INDEX idx_anonymous_reports_type ON anonymous_trend_reports(report_type);
CREATE INDEX idx_anonymous_reports_location ON anonymous_trend_reports(latitude, longitude);
CREATE INDEX idx_anonymous_reports_date ON anonymous_trend_reports(reported_at DESC);
