-- Create renewal_bookings table
CREATE TABLE IF NOT EXISTS renewal_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_type VARCHAR(50) NOT NULL, -- 'license', 'insurance', 'inspection'
  provider_name VARCHAR(200),
  provider_address TEXT,
  appointment_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_renewal_bookings_user_id ON renewal_bookings(user_id);
CREATE INDEX idx_renewal_bookings_type ON renewal_bookings(booking_type);
CREATE INDEX idx_renewal_bookings_status ON renewal_bookings(status);
