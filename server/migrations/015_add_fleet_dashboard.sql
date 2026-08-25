-- Create fleet_organizations table
CREATE TABLE IF NOT EXISTS fleet_organizations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(50),
  industry VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create fleet_drivers table for fleet driver management
CREATE TABLE IF NOT EXISTS fleet_drivers (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES fleet_organizations(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  employee_id VARCHAR(100),
  license_number VARCHAR(100),
  license_expiry DATE,
  insurance_expiry DATE,
  last_medical_check DATE,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'terminated'
  assigned_vehicle VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create fleet_compliance_items table for tracking compliance
CREATE TABLE IF NOT EXISTS fleet_compliance_items (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES fleet_drivers(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL, -- 'license', 'insurance', 'medical', 'certification'
  status VARCHAR(20) DEFAULT 'valid', -- 'valid', 'expiring', 'expired', 'pending'
  expiry_date DATE,
  issued_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create fleet_certifications table for driver certifications
CREATE TABLE IF NOT EXISTS fleet_certifications (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER NOT NULL REFERENCES fleet_drivers(id) ON DELETE CASCADE,
  certificate_type VARCHAR(100) NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_fleet_drivers_org_id ON fleet_drivers(organization_id);
CREATE INDEX idx_fleet_drivers_user_id ON fleet_drivers(user_id);
CREATE INDEX idx_fleet_drivers_status ON fleet_drivers(status);
CREATE INDEX idx_fleet_compliance_driver_id ON fleet_compliance_items(driver_id);
CREATE INDEX idx_fleet_compliance_status ON fleet_compliance_items(status);
CREATE INDEX idx_fleet_certifications_driver_id ON fleet_certifications(driver_id);
