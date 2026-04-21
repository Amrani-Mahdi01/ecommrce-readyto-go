-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES profiles(id) ON DELETE CASCADE,
  rating                INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title                 TEXT,
  body                  TEXT,
  is_verified_purchase  BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Add is_verified_purchase to existing table if it already exists without it
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read reviews"           ON reviews;
DROP POLICY IF EXISTS "Authenticated can review"      ON reviews;
DROP POLICY IF EXISTS "Verified purchase can review"  ON reviews;
DROP POLICY IF EXISTS "Users update own review"       ON reviews;
DROP POLICY IF EXISTS "Users delete own review"       ON reviews;

CREATE POLICY "Public read reviews"          ON reviews FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated can review"     ON reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own review"      ON reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own review"      ON reviews FOR DELETE USING (auth.uid() = user_id);

-- Index for fast product review lookups
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON reviews(user_id);
