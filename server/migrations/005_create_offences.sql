-- Create offences table for FRSC traffic offences
CREATE TABLE IF NOT EXISTS offences (
  id SERIAL PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50), -- 'speeding', 'parking', 'documentation', 'equipment', 'behavior'
  penalty_amount DECIMAL(10, 2),
  penalty_points INTEGER,
  section VARCHAR(50), -- FRSC regulation section
  severity VARCHAR(20) DEFAULT 'minor', -- 'minor', 'major', 'critical'
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for faster lookups
CREATE INDEX idx_offences_code ON offences(code);
CREATE INDEX idx_offences_category ON offences(category);
CREATE INDEX idx_offences_severity ON offences(severity);
CREATE INDEX idx_offences_is_active ON offences(is_active);

-- Insert sample FRSC offences
INSERT INTO offences (code, title, description, category, penalty_amount, penalty_points, section, severity) VALUES
('SPD001', 'Exceeding Speed Limit', 'Driving above the prescribed speed limit for the road type', 'speeding', 5000.00, 3, 'FRSC 55(1)', 'major'),
('SPD002', 'Dangerous Driving', 'Driving in a manner dangerous to the public', 'behavior', 10000.00, 6, 'FRSC 10', 'critical'),
('PRK001', 'Illegal Parking', 'Parking in unauthorized areas or blocking traffic', 'parking', 2000.00, 2, 'FRSC 52', 'minor'),
('DOC001', 'Driving Without License', 'Operating a vehicle without a valid driver\'s license', 'documentation', 10000.00, 6, 'FRSC 34', 'critical'),
('DOC002', 'Expired License', 'Driving with an expired driver\'s license', 'documentation', 3000.00, 3, 'FRSC 35', 'major'),
('DOC003', 'No Vehicle Insurance', 'Operating an uninsured vehicle', 'documentation', 15000.00, 6, 'FRSC 40', 'critical'),
('DOC004', 'Expired Insurance', 'Driving with expired vehicle insurance', 'documentation', 5000.00, 3, 'FRSC 41', 'major'),
('EQP001', 'Defective Brakes', 'Driving with faulty or ineffective brakes', 'equipment', 5000.00, 4, 'FRSC 70', 'major'),
('EQP002', 'Defective Lights', 'Driving with non-functional headlights or taillights', 'equipment', 2000.00, 2, 'FRSC 71', 'minor'),
('EQP003', 'No Seatbelt', 'Failure to wear seatbelt while driving', 'equipment', 3000.00, 2, 'FRSC 73', 'minor'),
('EQP004', 'Defective Tires', 'Driving with worn-out or damaged tires', 'equipment', 3000.00, 3, 'FRSC 72', 'major'),
('BEH001', 'Use of Phone While Driving', 'Using mobile phone without hands-free device', 'behavior', 5000.00, 4, 'FRSC 80', 'major'),
('BEH002', 'Drunk Driving', 'Driving under the influence of alcohol or drugs', 'behavior', 50000.00, 10, 'FRSC 15', 'critical'),
('BEH003', 'Failure to Obey Traffic Signs', 'Ignoring traffic signals, signs, or officer instructions', 'behavior', 3000.00, 3, 'FRSC 45', 'major'),
('BEH004', 'Reckless Overtaking', 'Overtaking in dangerous or prohibited situations', 'behavior', 5000.00, 4, 'FRSC 48', 'major'),
('DOC005', 'No Vehicle Registration', 'Driving an unregistered vehicle', 'documentation', 10000.00, 6, 'FRSC 38', 'critical'),
('DOC006', 'Expired Roadworthiness', 'Driving with expired roadworthiness certificate', 'documentation', 5000.00, 3, 'FRSC 42', 'major'),
('EQP005', 'No Rearview Mirror', 'Driving without rearview mirrors', 'equipment', 2000.00, 2, 'FRSC 74', 'minor'),
('EQP006', 'No Horn', 'Driving without a functional horn', 'equipment', 1000.00, 1, 'FRSC 75', 'minor'),
('SPD003', 'Speeding in School Zone', 'Exceeding speed limit in designated school zones', 'speeding', 10000.00, 6, 'FRSC 56', 'critical')
ON CONFLICT (code) DO NOTHING;
