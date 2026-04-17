-- Add promo code tracking columns to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_code      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Enable Realtime on orders so the sidebar watcher receives INSERT events
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
