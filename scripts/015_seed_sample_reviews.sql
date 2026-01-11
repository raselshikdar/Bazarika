-- Seed some sample reviews for testing
-- This helps verify the reviews display correctly

-- First, get product IDs
DO $$
DECLARE
  product_record RECORD;
  user_id UUID := 'a3c91014-0d2d-4296-85e4-7d98dbac7133'; -- Replace with actual user ID
BEGIN
  -- Add a review for each product
  FOR product_record IN SELECT id, name FROM products LIMIT 3 LOOP
    INSERT INTO reviews (product_id, user_id, rating, title, comment)
    VALUES (
      product_record.id,
      user_id,
      (FLOOR(RANDOM() * 2) + 4)::INT, -- Random rating 4-5
      'Great product!',
      'I really enjoyed this ' || product_record.name || '. Highly recommended!'
    )
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
