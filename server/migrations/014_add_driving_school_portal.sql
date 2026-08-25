-- Create driving_schools table
CREATE TABLE IF NOT EXISTS driving_schools (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(50),
  email VARCHAR(100),
  website VARCHAR(200),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  rating DECIMAL(2, 1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create school_students table for managing students enrolled in driving schools
CREATE TABLE IF NOT EXISTS school_students (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES driving_schools(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'dropped'
  completion_date DATE,
  notes TEXT,
  UNIQUE (school_id, user_id)
);

-- Create school_certificates table
CREATE TABLE IF NOT EXISTS school_certificates (
  id SERIAL PRIMARY KEY,
  school_id INTEGER NOT NULL REFERENCES driving_schools(id) ON DELETE CASCADE,
  student_id INTEGER NOT NULL REFERENCES school_students(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at DATE,
  is_valid BOOLEAN DEFAULT TRUE
);

-- Create indexes
CREATE INDEX idx_driving_schools_state ON driving_schools(state);
CREATE INDEX idx_driving_schools_city ON driving_schools(city);
CREATE INDEX idx_driving_schools_verified ON driving_schools(is_verified, is_active);
CREATE INDEX idx_school_students_school_id ON school_students(school_id);
CREATE INDEX idx_school_students_user_id ON school_students(user_id);
CREATE INDEX idx_school_students_status ON school_students(status);
CREATE INDEX idx_school_certificates_user_id ON school_certificates(user_id);
