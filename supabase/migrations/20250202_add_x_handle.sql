-- Add x_handle column to profiles table for X verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS x_handle TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_x_handle ON profiles(x_handle);

-- Update RLS policy to allow service role to insert with x_handle
-- (Service role bypasses RLS by default, but this ensures consistency)
