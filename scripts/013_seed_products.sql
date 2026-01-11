-- Seed some initial products
INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sku, is_active, is_featured, category_id) 
SELECT 
  'Wireless Bluetooth Headphones',
  'wireless-bluetooth-headphones',
  'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
  2499.00,
  2999.00,
  50,
  'ELEC-001',
  true,
  true,
  id
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sku, is_active, is_featured, category_id)
SELECT 
  'Smart Watch Pro',
  'smart-watch-pro',
  'Feature-rich smartwatch with heart rate monitor, GPS, and water resistance.',
  4999.00,
  5999.00,
  30,
  'ELEC-002',
  true,
  true,
  id
FROM categories WHERE slug = 'electronics'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sku, is_active, is_featured, category_id)
SELECT 
  'Cotton Casual T-Shirt',
  'cotton-casual-tshirt',
  'Comfortable 100% cotton t-shirt available in multiple colors.',
  599.00,
  799.00,
  100,
  'FASH-001',
  true,
  false,
  id
FROM categories WHERE slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sku, is_active, is_featured, category_id)
SELECT 
  'Premium Leather Wallet',
  'premium-leather-wallet',
  'Handcrafted genuine leather wallet with multiple card slots.',
  1299.00,
  1599.00,
  75,
  'FASH-002',
  true,
  true,
  id
FROM categories WHERE slug = 'fashion'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sku, is_active, is_featured, category_id)
SELECT 
  'Modern Table Lamp',
  'modern-table-lamp',
  'Elegant table lamp with adjustable brightness and minimalist design.',
  1899.00,
  2299.00,
  40,
  'HOME-001',
  true,
  false,
  id
FROM categories WHERE slug = 'home-living'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO products (name, slug, description, price, compare_at_price, stock_quantity, sku, is_active, is_featured, category_id)
SELECT 
  'Natural Face Moisturizer',
  'natural-face-moisturizer',
  'Organic face moisturizer with vitamin E and aloe vera.',
  849.00,
  999.00,
  60,
  'BEAU-001',
  true,
  true,
  id
FROM categories WHERE slug = 'beauty-health'
ON CONFLICT (slug) DO NOTHING;
