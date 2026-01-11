-- Comprehensive RLS Policy Fix Script
-- This script ensures all policies are correctly configured

-- =====================================================
-- 1. FIX PRODUCTS POLICIES (Admin Insert/Update)
-- =====================================================

-- Drop existing products admin policies
DROP POLICY IF EXISTS products_admin_insert ON products;
DROP POLICY IF EXISTS products_admin_update ON products;
DROP POLICY IF EXISTS products_admin_delete ON products;
DROP POLICY IF EXISTS products_admin_read_all ON products;

-- Recreate products admin policies with correct profile check
-- Allow admins to insert products
CREATE POLICY products_admin_insert ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update products
CREATE POLICY products_admin_update ON products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete products
CREATE POLICY products_admin_delete ON products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to read all products (including inactive)
CREATE POLICY products_admin_read_all ON products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 2. FIX PRODUCT_IMAGES POLICIES (Admin Access)
-- =====================================================

DROP POLICY IF EXISTS product_images_admin_insert ON product_images;
DROP POLICY IF EXISTS product_images_admin_update ON product_images;
DROP POLICY IF EXISTS product_images_admin_delete ON product_images;

CREATE POLICY product_images_admin_insert ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY product_images_admin_update ON product_images
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY product_images_admin_delete ON product_images
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- 3. FIX ORDERS POLICIES (User's Own Orders)
-- =====================================================

DROP POLICY IF EXISTS orders_select_own ON orders;
DROP POLICY IF EXISTS orders_insert_own ON orders;

-- Users can read their own orders
CREATE POLICY orders_select_own ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create orders for themselves
CREATE POLICY orders_insert_own ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. FIX ORDER_ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS order_items_select_own ON order_items;
DROP POLICY IF EXISTS order_items_select ON order_items;
DROP POLICY IF EXISTS order_items_insert_own ON order_items;
DROP POLICY IF EXISTS order_items_insert ON order_items;

-- Users can read order items for their own orders
CREATE POLICY order_items_select_own ON order_items
  FOR SELECT
  TO authenticated
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
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- =====================================================
-- 5. FIX REVIEWS POLICIES
-- =====================================================

DROP POLICY IF EXISTS reviews_public_read ON reviews;
DROP POLICY IF EXISTS reviews_insert_own ON reviews;
DROP POLICY IF EXISTS reviews_update_own ON reviews;
DROP POLICY IF EXISTS reviews_delete_own ON reviews;

-- Anyone can read reviews (public)
CREATE POLICY reviews_public_read ON reviews
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Users can insert their own reviews
CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY reviews_update_own ON reviews
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own reviews
CREATE POLICY reviews_delete_own ON reviews
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 6. FIX CARTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS carts_select_own ON carts;
DROP POLICY IF EXISTS carts_insert_own ON carts;
DROP POLICY IF EXISTS carts_update_own ON carts;
DROP POLICY IF EXISTS carts_delete_own ON carts;

CREATE POLICY carts_select_own ON carts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY carts_insert_own ON carts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY carts_update_own ON carts
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY carts_delete_own ON carts
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- 7. FIX CART_ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS cart_items_select ON cart_items;
DROP POLICY IF EXISTS cart_items_insert ON cart_items;
DROP POLICY IF EXISTS cart_items_update ON cart_items;
DROP POLICY IF EXISTS cart_items_delete ON cart_items;

CREATE POLICY cart_items_select ON cart_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY cart_items_insert ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY cart_items_update ON cart_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY cart_items_delete ON cart_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts 
      WHERE carts.id = cart_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

-- =====================================================
-- 8. FIX WISHLIST POLICIES
-- =====================================================

DROP POLICY IF EXISTS wishlist_select_own ON wishlist;
DROP POLICY IF EXISTS wishlist_insert_own ON wishlist;
DROP POLICY IF EXISTS wishlist_delete_own ON wishlist;

CREATE POLICY wishlist_select_own ON wishlist
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY wishlist_insert_own ON wishlist
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY wishlist_delete_own ON wishlist
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
