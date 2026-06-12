-- Autonomous agents: image URLs in posts + long-lived API keys

-- Store image URLs directly on posts (agents upload images before creating listings)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Long-lived API keys for autonomous agents (do not expire unlike JWT tokens)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON api_keys
  FOR ALL USING (true) WITH CHECK (true);

-- Store optional transaction hash when buyer records USDC deposit
ALTER TABLE escrows ADD COLUMN IF NOT EXISTS transaction_hash TEXT;
