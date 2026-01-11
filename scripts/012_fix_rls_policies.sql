-- Fix RLS policies to not query auth.users directly
-- This resolves the 401 permission denied error for anonymous users

-- Drop existing policies on products
DROP POLICY IF EXISTS "products_public_read" ON products;
DROP POLICY IF EXISTS "products_admin_insert" ON products;
DROP POLICY IF EXISTS "products_admin_update" ON products;
DROP POLICY IF EXISTS "products_admin_delete" ON products;

-- Create helper function to check admin role from profiles table
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Products policies
-- Allow anyone (including anonymous) to read active products
CREATE POLICY "products_public_read" ON products
  FOR SELECT USING (is_active = true);

-- Allow admins to read all products (including inactive)
CREATE POLICY "products_admin_read_all" ON products
  FOR SELECT USING (is_admin());

-- Admin write policies using the helper function
CREATE POLICY "products_admin_insert" ON products
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "products_admin_update" ON products
  FOR UPDATE USING (is_admin());

CREATE POLICY "products_admin_delete" ON products
  FOR DELETE USING (is_admin());

-- Fix categories policies
DROP POLICY IF EXISTS "categories_admin_insert" ON categories;
DROP POLICY IF EXISTS "categories_admin_update" ON categories;
DROP POLICY IF EXISTS "categories_admin_delete" ON categories;

CREATE POLICY "categories_admin_insert" ON categories
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "categories_admin_update" ON categories
  FOR UPDATE USING (is_admin());

CREATE POLICY "categories_admin_delete" ON categories
  FOR DELETE USING (is_admin());

-- Fix product_images policies
DROP POLICY IF EXISTS "product_images_admin_insert" ON product_images;
DROP POLICY IF EXISTS "product_images_admin_update" ON product_images;
DROP POLICY IF EXISTS "product_images_admin_delete" ON product_images;

CREATE POLICY "product_images_admin_insert" ON product_images
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "product_images_admin_update" ON product_images
  FOR UPDATE USING (is_admin());

CREATE POLICY "product_images_admin_delete" ON product_images
  FOR DELETE USING (is_admin());

-- Fix coupons policies
DROP POLICY IF EXISTS "coupons_admin_all" ON coupons;

CREATE POLICY "coupons_admin_insert" ON coupons
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "coupons_admin_update" ON coupons
  FOR UPDATE USING (is_admin());

CREATE POLICY "coupons_admin_delete" ON coupons
  FOR DELETE USING (is_admin());

-- Fix inventory_logs policies
DROP POLICY IF EXISTS "inventory_logs_admin_select" ON inventory_logs;
DROP POLICY IF EXISTS "inventory_logs_admin_insert" ON inventory_logs;

CREATE POLICY "inventory_logs_admin_select" ON inventory_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "inventory_logs_admin_insert" ON inventory_logs
  FOR INSERT WITH CHECK (is_admin());

-- Fix orders admin policies
DROP POLICY IF EXISTS "orders_admin_select" ON orders;
DROP POLICY IF EXISTS "orders_admin_update" ON orders;

CREATE POLICY "orders_admin_select" ON orders
  FOR SELECT USING (is_admin());

CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE USING (is_admin());

-- Fix profiles admin read policy
DROP POLICY IF EXISTS "profiles_admin_read" ON profiles;

CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (is_admin());
