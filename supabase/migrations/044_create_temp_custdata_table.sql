/**
 * Create temp_custdata table
 * This table will store temporary customer data for import/export operations
 */

-- Create the temp_custdata table
CREATE TABLE temp_custdata (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT,
  user_phoneno TEXT,
  recipient_name TEXT,
  recipient_phoneno TEXT,
  recipient_address_line1 TEXT,
  recipient_city TEXT,
  recipient_region TEXT,
  recipient_postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_temp_custdata_user_phoneno ON temp_custdata(user_phoneno);
CREATE INDEX idx_temp_custdata_recipient_name ON temp_custdata(recipient_name);
CREATE INDEX idx_temp_custdata_recipient_postal_code ON temp_custdata(recipient_postal_code);

-- Enable Row Level Security (RLS) if needed
-- Note: This table is for temporary customer data, so proper RLS should be configured based on your requirements
ALTER TABLE temp_custdata ENABLE ROW LEVEL SECURITY;

-- Optional: Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_temp_custdata_updated_at 
    BEFORE UPDATE ON temp_custdata 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comment
COMMENT ON TABLE temp_custdata IS 'Temporary table for customer data import/export operations';