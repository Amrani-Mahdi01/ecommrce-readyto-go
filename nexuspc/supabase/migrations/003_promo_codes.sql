-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC DEFAULT NULL,
  usage_limit   INT DEFAULT NULL,
  usage_count   INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  expires_at    TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read active codes (for validation at checkout)
CREATE POLICY "promo_read" ON promo_codes FOR SELECT USING (true);

-- Only service role / admin can insert/update/delete
CREATE POLICY "promo_admin_write" ON promo_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Helper function to safely increment usage count
CREATE OR REPLACE FUNCTION increment_promo_usage(promo_id UUID)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE promo_codes SET usage_count = usage_count + 1 WHERE id = promo_id;
$$;

-- Insert a sample code for testing
INSERT INTO promo_codes (code, discount_type, discount_value, usage_limit)
VALUES ('NEXUS10', 'percent', 10, 100)
ON CONFLICT (code) DO NOTHING;
