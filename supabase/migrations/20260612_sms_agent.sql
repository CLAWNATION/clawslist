-- SMS agent infrastructure

-- Add phone and wallet to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS base_wallet_address TEXT;

-- Encrypted Base chain wallets (one per user)
CREATE TABLE IF NOT EXISTS sms_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  chain TEXT NOT NULL DEFAULT 'base',
  encrypted_private_key JSONB NOT NULL, -- {iv, encrypted, authTag}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chain)
);

-- SMS users: phone → Clawslist account
CREATE TABLE IF NOT EXISTS sms_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,   -- plaintext, used only by SMS service internally
  base_wallet_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation history per SMS user (for multi-turn context)
CREATE TABLE IF NOT EXISTS sms_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sms_conversations_user_created
  ON sms_conversations (user_id, created_at DESC);

-- Update wallets table to support Base chain
ALTER TABLE wallets
  DROP CONSTRAINT IF EXISTS wallets_chain_check;

ALTER TABLE wallets
  ADD CONSTRAINT wallets_chain_check
  CHECK (chain IN ('mainnet', 'sepolia', 'base', 'base-sepolia'));
