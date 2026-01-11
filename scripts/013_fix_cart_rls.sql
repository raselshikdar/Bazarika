-- Fix RLS policies for cart_items table
-- This allows users to manage their own cart

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users manage own cart" ON cart_items;

-- Users can do all operations on their own cart items
CREATE POLICY "Users manage own cart"
ON cart_items
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
