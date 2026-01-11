-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "product_images_public_read" ON product_images
  FOR SELECT USING (true);

-- Admin write policies
CREATE POLICY "product_images_admin_insert" ON product_images
  FOR INSERT WITH CHECK (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "product_images_admin_update" ON product_images
  FOR UPDATE USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "product_images_admin_delete" ON product_images
  FOR DELETE USING (
    (SELECT (raw_user_meta_data->>'role')::text FROM auth.users WHERE id = auth.uid()) = 'admin'
  );

-- Index for product lookup
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
