-- Fix all RLS policies comprehensively

-- ==========================================
-- ORDERS: Ensure users can see their own orders
-- ==========================================

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS orders_select_own ON orders;
DROP POLICY IF EXISTS orders_insert_own ON orders;
DROP POLICY IF EXISTS orders_admin_select ON orders;
DROP POLICY IF EXISTS orders_admin_update ON orders;

-- Users can view their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own orders  
CREATE POLICY orders_insert_own ON orders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admin can view all orders
CREATE POLICY orders_admin_select ON orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admin can update any order
CREATE POLICY orders_admin_update ON orders
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- ORDER_ITEMS: Ensure items are visible with orders
-- ==========================================

DROP POLICY IF EXISTS order_items_select ON order_items;
DROP POLICY IF EXISTS order_items_select_own ON order_items;
DROP POLICY IF EXISTS order_items_insert ON order_items;
DROP POLICY IF EXISTS order_items_insert_own ON order_items;
DROP POLICY IF EXISTS order_items_admin_select ON order_items;

-- Users can view order items for their own orders
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert order items for their own orders
CREATE POLICY order_items_insert_own ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admin can view all order items
CREATE POLICY order_items_admin_select ON order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ==========================================
-- REVIEWS: Ensure public read and user insert
-- ==========================================

DROP POLICY IF EXISTS reviews_public_read ON reviews;
DROP POLICY IF EXISTS reviews_insert_own ON reviews;
DROP POLICY IF EXISTS reviews_update_own ON reviews;
DROP POLICY IF EXISTS reviews_delete_own ON reviews;

-- Anyone can read reviews (including anonymous)
CREATE POLICY reviews_public_read ON reviews
  FOR SELECT
  USING (true);

-- Logged in users can insert their own reviews
CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY reviews_update_own ON reviews
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY reviews_delete_own ON reviews
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- CARTS: Ensure cart operations work
-- ==========================================

DROP POLICY IF EXISTS carts_select_own ON carts;
DROP POLICY IF EXISTS carts_insert_own ON carts;
DROP POLICY IF EXISTS carts_update_own ON carts;
DROP POLICY IF EXISTS carts_delete_own ON carts;

-- Users can view their own cart
CREATE POLICY carts_select_own ON carts
  FOR SELECT
  USING (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can create their own cart
CREATE POLICY carts_insert_own ON carts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR (user_id IS NULL AND session_id IS NOT NULL));

-- Users can update their own cart
CREATE POLICY carts_update_own ON carts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own cart
CREATE POLICY carts_delete_own ON carts
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- CART_ITEMS: Ensure cart item operations work
-- ==========================================

DROP POLICY IF EXISTS cart_items_select ON cart_items;
DROP POLICY IF EXISTS cart_items_insert ON cart_items;
DROP POLICY IF EXISTS cart_items_update ON cart_items;
DROP POLICY IF EXISTS cart_items_delete ON cart_items;

-- Users can view their cart items
CREATE POLICY cart_items_select ON cart_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND (carts.user_id = auth.uid() OR (carts.user_id IS NULL AND carts.session_id IS NOT NULL))
    )
  );

-- Users can add items to their cart
CREATE POLICY cart_items_insert ON cart_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- Users can update their cart items
CREATE POLICY cart_items_update ON cart_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- Users can remove their cart items
CREATE POLICY cart_items_delete ON cart_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM carts
      WHERE carts.id = cart_items.cart_id
      AND carts.user_id = auth.uid()
    )
  );

-- ==========================================
-- WISHLIST: Ensure wishlist operations work
-- ==========================================

DROP POLICY IF EXISTS wishlist_select_own ON wishlist;
DROP POLICY IF EXISTS wishlist_insert_own ON wishlist;
DROP POLICY IF EXISTS wishlist_delete_own ON wishlist;

-- Users can view their own wishlist
CREATE POLICY wishlist_select_own ON wishlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY wishlist_insert_own ON wishlist
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY wishlist_delete_own ON wishlist
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==========================================
-- PROFILES: Ensure profile operations work
-- ==========================================

DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_admin_read ON profiles;

-- Users can view their own profile
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow reading profiles for reviews (public name)
CREATE POLICY profiles_public_name ON profiles
  FOR SELECT
  USING (true);

-- Users can create their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY profiles_admin_read ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = auth.uid()
      AND p2.role = 'admin'
    )
  );
