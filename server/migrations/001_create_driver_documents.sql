-- Create driver_documents table for Digital Driver Wallet
CREATE TABLE IF NOT EXISTS driver_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL, -- license, insurance, roadworthiness, registration, lasdri, hackney
  document_name VARCHAR(255) NOT NULL,
  expiry_date DATE,
  file_url TEXT,
  file_data BYTEA, -- Encrypted file storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_driver_documents_user_id ON driver_documents(user_id);
CREATE INDEX idx_driver_documents_expiry_date ON driver_documents(expiry_date);
CREATE INDEX idx_driver_documents_type ON driver_documents(document_type);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_driver_documents_updated_at BEFORE UPDATE
  ON driver_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
