-- Comprehensive Pharmacy Management System Database Schema
-- Based on user stories US01-US25

-- Drop existing tables to recreate with new structure
DROP TABLE IF EXISTS public.purchase_orders CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- Update profiles table with new roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'regular' CHECK (client_type IN ('regular', 'elderly', 'insurance'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS modification_history JSONB DEFAULT '[]';

-- Update role constraint to include new roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('seller', 'manager', 'owner', 'client'));

-- Create clients table (separate from user profiles for non-authenticated clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  birth_date DATE,
  client_type TEXT DEFAULT 'regular' CHECK (client_type IN ('regular', 'elderly', 'insurance')),
  is_active BOOLEAN DEFAULT TRUE,
  modification_history JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create medication categories and labels table
CREATE TABLE IF NOT EXISTS public.medication_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  anvisa_label TEXT NOT NULL CHECK (anvisa_label IN ('over-the-counter', 'red-label', 'black-label')),
  requires_prescription BOOLEAN DEFAULT FALSE,
  max_quantity_per_sale INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  cnpj TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products/medications table with enhanced fields
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  barcode TEXT UNIQUE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  category_id UUID REFERENCES public.medication_categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  expiration_date DATE NOT NULL,
  batch_number TEXT,
  anvisa_label TEXT NOT NULL CHECK (anvisa_label IN ('over-the-counter', 'red-label', 'black-label')),
  requires_prescription BOOLEAN DEFAULT FALSE,
  max_quantity_per_sale INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales table (header)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id),
  seller_id UUID REFERENCES public.profiles(id) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  prescription_required BOOLEAN DEFAULT FALSE,
  prescription_file_url TEXT,
  invoice_number TEXT UNIQUE,
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sale items table (details)
CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_applied DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table for controlled medications
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID REFERENCES public.sales(id),
  client_id UUID REFERENCES public.clients(id),
  doctor_name TEXT NOT NULL,
  doctor_crm TEXT NOT NULL,
  prescription_date DATE NOT NULL,
  file_url TEXT,
  is_digitized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock movements table for audit trail
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'purchase', 'adjustment', 'expiration')),
  quantity INTEGER NOT NULL, -- positive for inbound, negative for outbound
  reference_id UUID, -- sale_id, purchase_order_id, etc.
  notes TEXT,
  user_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_delivery DATE,
  received_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create purchase order items table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL, -- 'clients', 'products', 'sales', 'reports', etc.
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create role permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_id UUID REFERENCES public.permissions(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role, permission_id)
);

-- Create audit log table for security and compliance
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default medication categories
INSERT INTO public.medication_categories (name, description, anvisa_label, requires_prescription, max_quantity_per_sale) VALUES
('Over-the-Counter', 'Medications that can be sold without prescription', 'over-the-counter', FALSE, NULL),
('Controlled Substance - Red Label', 'Controlled medications requiring prescription', 'red-label', TRUE, 30),
('Controlled Substance - Black Label', 'Highly controlled medications with strict limits', 'black-label', TRUE, 5);

-- Insert default payment methods
INSERT INTO public.payment_methods (name) VALUES
('Cash'),
('Credit Card'),
('Debit Card'),
('PIX'),
('Insurance');

-- Insert default permissions
INSERT INTO public.permissions (name, description, module, action) VALUES
-- Client permissions
('Create Client', 'Can register new clients', 'clients', 'create'),
('View Client', 'Can view client information', 'clients', 'read'),
('Update Client', 'Can update client information', 'clients', 'update'),
('Delete Client', 'Can delete clients (LGPD compliance)', 'clients', 'delete'),

-- Product permissions
('Create Product', 'Can register new medications', 'products', 'create'),
('View Product', 'Can view product information', 'products', 'read'),
('Update Product', 'Can update product information', 'products', 'update'),
('Delete Product', 'Can delete products', 'products', 'delete'),

-- Sales permissions
('Create Sale', 'Can register sales', 'sales', 'create'),
('View Sale', 'Can view sales information', 'sales', 'read'),
('Apply Discount', 'Can apply discounts to sales', 'sales', 'discount'),

-- Reports permissions
('View Sales Report', 'Can view sales reports', 'reports', 'sales'),
('View Stock Report', 'Can view stock reports', 'reports', 'stock'),
('View Financial Report', 'Can view financial reports', 'reports', 'financial'),
('View Controlled Meds Report', 'Can view controlled medications report', 'reports', 'controlled'),

-- Admin permissions
('Manage Users', 'Can manage user accounts and roles', 'admin', 'users'),
('Manage Permissions', 'Can manage roles and permissions', 'admin', 'permissions');

-- Insert default role permissions
-- Seller permissions
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'seller', id FROM public.permissions 
WHERE name IN ('View Client', 'Create Sale', 'View Sale', 'View Product');

-- Manager permissions (includes seller permissions plus more)
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'manager', id FROM public.permissions 
WHERE name IN (
  'Create Client', 'View Client', 'Update Client',
  'Create Product', 'View Product', 'Update Product',
  'Create Sale', 'View Sale', 'Apply Discount',
  'View Sales Report', 'View Stock Report'
);

-- Owner permissions (all permissions)
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'owner', id FROM public.permissions;

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users with proper roles
-- Clients policies
CREATE POLICY "clients_select_authenticated" ON public.clients FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller', 'manager', 'owner'))
);
CREATE POLICY "clients_insert_manager" ON public.clients FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'owner'))
);
CREATE POLICY "clients_update_manager" ON public.clients FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'owner'))
);
CREATE POLICY "clients_delete_owner" ON public.clients FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Products policies
CREATE POLICY "products_select_authenticated" ON public.products FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller', 'manager', 'owner'))
);
CREATE POLICY "products_insert_manager" ON public.products FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'owner'))
);
CREATE POLICY "products_update_manager" ON public.products FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('manager', 'owner'))
);
CREATE POLICY "products_delete_owner" ON public.products FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'owner')
);

-- Sales policies
CREATE POLICY "sales_select_authenticated" ON public.sales FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller', 'manager', 'owner'))
);
CREATE POLICY "sales_insert_seller" ON public.sales FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('seller', 'manager', 'owner'))
);

-- Similar policies for other tables...
-- (Additional policies would be created for all tables following the same pattern)

-- Create functions for automatic stock updates
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease stock when sale item is inserted
  UPDATE public.products 
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.product_id;
  
  -- Insert stock movement record
  INSERT INTO public.stock_movements (product_id, movement_type, quantity, reference_id, user_id)
  VALUES (NEW.product_id, 'sale', -NEW.quantity, NEW.sale_id, auth.uid());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock updates
CREATE TRIGGER trigger_update_stock_on_sale
  AFTER INSERT ON public.sale_items
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_sale();

-- Create function to check low stock
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  current_stock INTEGER,
  min_stock_level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.stock_quantity, p.min_stock_level
  FROM public.products p
  WHERE p.stock_quantity <= p.min_stock_level
    AND p.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to check expiring products
CREATE OR REPLACE FUNCTION get_expiring_products(days_ahead INTEGER DEFAULT 30)
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  expiration_date DATE,
  days_until_expiration INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.name, p.expiration_date, 
         (p.expiration_date - CURRENT_DATE) as days_until_expiration
  FROM public.products p
  WHERE p.expiration_date <= CURRENT_DATE + INTERVAL '1 day' * days_ahead
    AND p.expiration_date > CURRENT_DATE
    AND p.is_active = TRUE
  ORDER BY p.expiration_date ASC;
END;
$$ LANGUAGE plpgsql;
