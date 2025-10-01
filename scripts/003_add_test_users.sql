-- Note: These are test accounts for development only
-- In production, users should sign up through the normal registration process

-- Test Staff Account
-- Email: staff@pharmacare.com
-- Password: teststaff123
-- Role: staff

-- Test Admin Account  
-- Email: admin@pharmacare.com
-- Password: testadmin123
-- Role: admin

-- Insert test user profiles (these will be linked when users sign up with these emails)
INSERT INTO public.profiles (id, email, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'staff@pharmacare.com', 'Test Staff User', 'staff'),
  ('22222222-2222-2222-2222-222222222222', 'admin@pharmacare.com', 'Test Admin User', 'admin')
ON CONFLICT (id) DO NOTHING;

-- Add some sample sales data for the admin dashboard
INSERT INTO public.sales (id, product_id, staff_id, quantity, unit_price, total_amount) VALUES
  ('77777777-7777-7777-7777-777777777777', '660e8400-e29b-41d4-a716-446655440001', '11111111-1111-1111-1111-111111111111', 2, 8.99, 17.98),
  ('88888888-8888-8888-8888-888888888888', '660e8400-e29b-41d4-a716-446655440004', '11111111-1111-1111-1111-111111111111', 1, 15.99, 15.99),
  ('99999999-9999-9999-9999-999999999999', '660e8400-e29b-41d4-a716-446655440002', '22222222-2222-2222-2222-222222222222', 3, 12.50, 37.50);
