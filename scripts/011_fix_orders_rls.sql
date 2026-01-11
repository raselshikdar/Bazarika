-- Fix RLS policies for orders table
-- This allows users to read their own orders

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;

-- Users can read their own orders
CREATE POLICY "Users can read own orders"
ON orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can insert own orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own orders (e.g., cancel)
CREATE POLICY "Users can update own orders"
ON orders
FOR UPDATE
USING (auth.uid() = user_id);
