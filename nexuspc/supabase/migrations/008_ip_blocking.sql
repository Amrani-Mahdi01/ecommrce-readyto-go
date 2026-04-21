-- Add IP address tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Blocked IPs table
CREATE TABLE IF NOT EXISTS blocked_ips (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip          TEXT NOT NULL UNIQUE,
  reason      TEXT,
  blocked_by  TEXT DEFAULT 'system',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON blocked_ips(ip);
CREATE INDEX IF NOT EXISTS idx_orders_ip ON orders(ip_address);

-- RLS: only admins/service role can manage blocked IPs
ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access" ON blocked_ips;
CREATE POLICY "Service role full access" ON blocked_ips USING (true) WITH CHECK (true);
