-- Fix RLS policies for wishlist_items table
-- This allows users to manage their own wishlist

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlist_items;

-- Users can do all operations on their own wishlist items
CREATE POLICY "Users manage own wishlist"
ON wishlist_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
