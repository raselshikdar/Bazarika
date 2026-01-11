-- Fix: Set first user as admin
-- This script ensures the store owner has admin access

-- Update existing users to admin if needed (you can run this manually for specific users)
-- UPDATE profiles SET role = 'admin' WHERE id = 'YOUR_USER_ID';

-- Create a helper function to make a user admin by email
CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS VOID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find user ID from auth.users
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', user_email;
  END IF;
  
  -- Update their profile to admin
  UPDATE profiles SET role = 'admin', updated_at = NOW() WHERE id = user_id;
  
  RAISE NOTICE 'User % is now an admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (admins can promote others)
GRANT EXECUTE ON FUNCTION make_user_admin(TEXT) TO authenticated;
