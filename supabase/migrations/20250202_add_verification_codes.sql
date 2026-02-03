-- Create verification_codes table to track generated vs claimed codes
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  x_handle TEXT,
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'claimed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  claimed_at TIMESTAMP WITH TIME ZONE,
  claimed_by_user_id UUID REFERENCES auth.users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
CREATE INDEX IF NOT EXISTS idx_verification_codes_status ON verification_codes(status);
CREATE INDEX IF NOT EXISTS idx_verification_codes_x_handle ON verification_codes(x_handle);

-- Enable RLS
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role full access" ON verification_codes
  FOR ALL USING (true) WITH CHECK (true);
