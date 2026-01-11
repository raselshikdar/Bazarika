-- Seed some initial categories
INSERT INTO categories (name, slug, description) VALUES
  ('Electronics', 'electronics', 'Electronic gadgets and devices'),
  ('Fashion', 'fashion', 'Clothing, shoes, and accessories'),
  ('Home & Living', 'home-living', 'Furniture, decor, and home essentials'),
  ('Beauty & Health', 'beauty-health', 'Skincare, makeup, and health products'),
  ('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear')
ON CONFLICT (slug) DO NOTHING;
