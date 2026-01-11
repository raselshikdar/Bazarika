-- Fix infinite recursion in RLS policies
-- The issue: Admin policies on products/categories query profiles table
-- But profiles table also has RLS, causing infinite recursion

-- =====================================================
-- STEP 1: Fix profiles table policies first
-- =====================================================

-- Drop problematic profiles policies
DROP POLICY IF EXISTS "profiles_public_name" ON profiles;
DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;

-- Recreate profiles_admin_read using JWT claim instead of self-reference
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR (auth.jwt() ->> 'role')::text = 'admin'
    OR ((auth.jwt() -> 'user_metadata') ->> 'role')::text = 'admin'
  );

-- Allow anyone to read basic profile info (for reviews display)
CREATE POLICY "profiles_public_name" ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- =====================================================
-- STEP 2: Fix admin policies to avoid querying profiles
-- Use SECURITY DEFINER function instead
-- =====================================================

-- Create a SECURITY DEFINER function to check admin status
-- This bypasses RLS on profiles table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- =====================================================
-- STEP 3: Recreate products policies using the function
-- =====================================================

DROP POLICY IF EXISTS products_admin_insert ON products;
DROP POLICY IF EXISTS products_admin_update ON products;
DROP POLICY IF EXISTS products_admin_delete ON products;
DROP POLICY IF EXISTS products_admin_read_all ON products;
DROP POLICY IF EXISTS products_admin_write ON products;

-- Public can read active products
DROP POLICY IF EXISTS products_select_all ON products;
CREATE POLICY products_select_all ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can insert products
CREATE POLICY products_admin_insert ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can update products
CREATE POLICY products_admin_update ON products
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can delete products
CREATE POLICY products_admin_delete ON products
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Admins can read all products (including inactive)
CREATE POLICY products_admin_read_all ON products
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- STEP 4: Fix product_images policies
-- =====================================================

DROP POLICY IF EXISTS product_images_admin_insert ON product_images;
DROP POLICY IF EXISTS product_images_admin_update ON product_images;
DROP POLICY IF EXISTS product_images_admin_delete ON product_images;

CREATE POLICY product_images_admin_insert ON product_images
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_admin_update ON product_images
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY product_images_admin_delete ON product_images
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- STEP 5: Fix categories policies
-- =====================================================

DROP POLICY IF EXISTS categories_admin_insert ON categories;
DROP POLICY IF EXISTS categories_admin_update ON categories;
DROP POLICY IF EXISTS categories_admin_delete ON categories;

CREATE POLICY categories_admin_insert ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY categories_admin_update ON categories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY categories_admin_delete ON categories
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- STEP 6: Fix coupons policies
-- =====================================================

DROP POLICY IF EXISTS coupons_admin_insert ON coupons;
DROP POLICY IF EXISTS coupons_admin_update ON coupons;
DROP POLICY IF EXISTS coupons_admin_delete ON coupons;

CREATE POLICY coupons_admin_insert ON coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY coupons_admin_update ON coupons
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY coupons_admin_delete ON coupons
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- STEP 7: Fix inventory_logs policies
-- =====================================================

DROP POLICY IF EXISTS inventory_logs_admin_insert ON inventory_logs;
DROP POLICY IF EXISTS inventory_logs_admin_select ON inventory_logs;

CREATE POLICY inventory_logs_admin_insert ON inventory_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY inventory_logs_admin_select ON inventory_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- =====================================================
-- STEP 8: Fix orders admin policies
-- =====================================================

DROP POLICY IF EXISTS orders_admin_select ON orders;
DROP POLICY IF EXISTS orders_admin_update ON orders;

CREATE POLICY orders_admin_select ON orders
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY orders_admin_update ON orders
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================
-- STEP 9: Fix order_items admin policies
-- =====================================================

DROP POLICY IF EXISTS order_items_admin_select ON order_items;

CREATE POLICY order_items_admin_select ON order_items
  FOR SELECT
  TO authenticated
  USING (public.is_admin());
