-- Add admin read policies for orders and order_items
-- This allows admins to view all orders while users can only see their own

-- First, drop existing select policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "orders_select_own" ON orders;
DROP POLICY IF EXISTS "orders_user_read" ON orders;
DROP POLICY IF EXISTS "orders_admin_read" ON orders;
DROP POLICY IF EXISTS "order_items_select_own" ON order_items;
DROP POLICY IF EXISTS "order_items_user_read" ON order_items;
DROP POLICY IF EXISTS "order_items_admin_read" ON order_items;

-- Create combined SELECT policy for orders
-- Users can read their own orders OR admins can read all orders
CREATE POLICY "orders_select_policy" ON orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Create combined SELECT policy for order_items
-- Users can read items for their own orders OR admins can read all items
CREATE POLICY "order_items_select_policy" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
