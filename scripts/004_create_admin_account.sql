-- Create admin account with email admin123@pharmacare.com and password admin123
-- This will be handled through Supabase Auth, but we'll create the profile

-- Insert admin user profile (the auth user will be created when they first sign up)
INSERT INTO user_profiles (id, email, full_name, role, phone, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin123@pharmacare.com',
  'System Administrator',
  'admin',
  '+1-555-0123',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Note: The actual authentication user must be created through Supabase Auth
-- Use email: admin123@pharmacare.com and password: admin123
