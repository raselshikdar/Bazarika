-- This script verifies and fixes RLS policies for orders and reviews
-- Run this to ensure orders and reviews are visible to users

-- First, let's check if RLS is enabled on the tables
DO $$
BEGIN
  -- Enable RLS on orders if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'orders' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
  END IF;
  
  -- Enable RLS on reviews if not already enabled  
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'reviews' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies to recreate them correctly
DROP POLICY IF EXISTS orders_select_own ON orders;
DROP POLICY IF EXISTS orders_insert_own ON orders;
DROP POLICY IF EXISTS orders_update_own ON orders;

DROP POLICY IF EXISTS order_items_select_own ON order_items;
DROP POLICY IF EXISTS order_items_insert_own ON order_items;

DROP POLICY IF EXISTS reviews_public_read ON reviews;
DROP POLICY IF EXISTS reviews_insert_own ON reviews;
DROP POLICY IF EXISTS reviews_update_own ON reviews;
DROP POLICY IF EXISTS reviews_delete_own ON reviews;

-- ORDERS: Users can only see their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- ORDERS: Users can create orders for themselves
CREATE POLICY orders_insert_own ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ORDERS: Users can update their own orders
CREATE POLICY orders_update_own ON orders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ORDER_ITEMS: Users can see items from their own orders
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ORDER_ITEMS: Users can insert items into their own orders
CREATE POLICY order_items_insert_own ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- REVIEWS: Anyone can read reviews (public)
CREATE POLICY reviews_public_read ON reviews
  FOR SELECT
  USING (true);

-- REVIEWS: Authenticated users can insert their own reviews
CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- REVIEWS: Users can update their own reviews
CREATE POLICY reviews_update_own ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- REVIEWS: Users can delete their own reviews
CREATE POLICY reviews_delete_own ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- Verify policies were created
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items', 'reviews')
ORDER BY tablename, policyname;
