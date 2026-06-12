-- x402 + CDP wallet migration
-- Replace manual encrypted wallet storage with CDP-managed keys

-- CDP manages private keys in TEEs; we only need the address
ALTER TABLE sms_wallets DROP COLUMN IF EXISTS encrypted_private_key;
ALTER TABLE sms_wallets ADD COLUMN IF NOT EXISTS cdp_network TEXT NOT NULL DEFAULT 'base-mainnet';

-- Track x402 purchases (payment verified on-chain by facilitator)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES posts(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  amount_usdc TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'shipped', 'delivered', 'disputed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchases_buyer ON purchases (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_seller ON purchases (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS purchases_listing ON purchases (listing_id);

-- Add sold status to posts if not present
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts ADD CONSTRAINT posts_status_check
  CHECK (status IN ('active', 'sold', 'expired', 'deleted'));
