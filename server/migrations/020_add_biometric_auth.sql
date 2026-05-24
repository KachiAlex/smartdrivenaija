-- Create biometric_credentials table for storing public keys
CREATE TABLE IF NOT EXISTS biometric_credentials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) NOT NULL, -- Unique ID for this biometric credential
  public_key TEXT NOT NULL, -- Base64-encoded public key
  device_id VARCHAR(255) NOT NULL, -- Device identifier
  device_name VARCHAR(200), -- Human-readable device name
  device_type VARCHAR(50), -- 'ios', 'android'
  biometric_type VARCHAR(50), -- 'fingerprint', 'face', 'iris'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, credential_id)
);

-- Create biometric_challenges table for challenge-response flow
CREATE TABLE IF NOT EXISTS biometric_challenges (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id VARCHAR(255) NOT NULL,
  challenge VARCHAR(255) NOT NULL, -- Random challenge string
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_biometric_credentials_user_id ON biometric_credentials(user_id);
CREATE INDEX idx_biometric_credentials_device ON biometric_credentials(device_id);
CREATE INDEX idx_biometric_credentials_active ON biometric_credentials(user_id, is_active);
CREATE INDEX idx_biometric_challenges_user ON biometric_challenges(user_id, credential_id);
CREATE INDEX idx_biometric_challenges_expires ON biometric_challenges(expires_at);
