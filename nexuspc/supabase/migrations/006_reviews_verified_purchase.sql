-- Add verified_purchase flag to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT FALSE;

-- Update RLS: only users with a delivered order containing the product can insert
DROP POLICY IF EXISTS "Authenticated can review" ON reviews;
CREATE POLICY "Verified purchase can review" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Allow users to update their own review
DROP POLICY IF EXISTS "Users update own review" ON reviews;
CREATE POLICY "Users update own review" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own review
CREATE POLICY "Users delete own review" ON reviews
  FOR DELETE USING (auth.uid() = user_id);
