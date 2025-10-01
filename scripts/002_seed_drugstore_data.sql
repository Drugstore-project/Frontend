-- Insert sample suppliers
INSERT INTO public.suppliers (id, name, contact_email, contact_phone, address) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'MedSupply Corp', 'orders@medsupply.com', '+1-555-0101', '123 Medical Ave, Healthcare City'),
  ('550e8400-e29b-41d4-a716-446655440002', 'PharmaCorp Ltd', 'sales@pharmacorp.com', '+1-555-0102', '456 Pharma Street, Medicine Town'),
  ('550e8400-e29b-41d4-a716-446655440003', 'HealthDistributors Inc', 'info@healthdist.com', '+1-555-0103', '789 Wellness Blvd, Care City');

-- Insert sample products
INSERT INTO public.products (id, name, description, price, stock_quantity, category, requires_prescription, supplier_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', 'Aspirin 325mg', 'Pain reliever and fever reducer', 8.99, 150, 'Pain Relief', false, '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Ibuprofen 200mg', 'Anti-inflammatory pain reliever', 12.50, 200, 'Pain Relief', false, '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440003', 'Amoxicillin 500mg', 'Antibiotic for bacterial infections', 25.99, 75, 'Antibiotics', true, '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Vitamin D3 1000IU', 'Vitamin D supplement', 15.99, 300, 'Vitamins', false, '550e8400-e29b-41d4-a716-446655440003'),
  ('660e8400-e29b-41d4-a716-446655440005', 'Lisinopril 10mg', 'ACE inhibitor for blood pressure', 18.75, 120, 'Cardiovascular', true, '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440006', 'Cough Syrup', 'Relief for cough and cold symptoms', 9.99, 80, 'Cold & Flu', false, '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440007', 'Insulin Glargine', 'Long-acting insulin', 89.99, 25, 'Diabetes', true, '550e8400-e29b-41d4-a716-446655440002'),
  ('660e8400-e29b-41d4-a716-446655440008', 'Multivitamin', 'Daily vitamin supplement', 22.99, 180, 'Vitamins', false, '550e8400-e29b-41d4-a716-446655440003');

-- Create trigger function for auto-creating profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'staff')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
