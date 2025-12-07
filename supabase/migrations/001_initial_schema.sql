-- ==============================================================================
-- ShortTail.id Database Schema
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- 1. ENUMS & TYPES
CREATE TYPE app_role AS ENUM ('master_admin', 'normal_admin', 'kasir', 'normal_user');
CREATE TYPE membership_tier AS ENUM ('Newborn', 'Transitional', 'Juvenile', 'Adolescence', 'Adulthood');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE order_source AS ENUM ('marketplace', 'pos');

-- 2. USERS & PROFILES
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  user_phoneno TEXT UNIQUE NOT NULL,
  user_name TEXT,
  user_email TEXT,
  user_avatar_url TEXT,
  role app_role DEFAULT 'normal_user',
  tier membership_tier DEFAULT 'Newborn',
  points_balance INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  address_line1 TEXT,
  city TEXT,
  region_state_province TEXT,
  postal_code TEXT,
  country_id INTEGER DEFAULT 62,
  recipient_name TEXT,
  recipient_address_line1 TEXT,
  recipient_city TEXT,
  recipient_region TEXT,
  recipient_postal_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := 'ST' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_referral_code();

-- Handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_email, user_phoneno, user_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'phone', new.email),
    new.raw_user_meta_data->>'full_name',
    'normal_user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. PETS
CREATE TABLE public.pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_type TEXT NOT NULL,
  pet_name TEXT NOT NULL,
  pet_birthday DATE,
  pet_gender TEXT,
  pet_weight_kg DECIMAL(5,2),
  pet_chip_id TEXT,
  pet_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE,
  category TEXT,
  base_price NUMERIC(12, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  condition TEXT CHECK (condition IN ('new', 'secondhand')),
  has_variants BOOLEAN DEFAULT FALSE,
  main_image_url TEXT,
  gallery_image_urls TEXT[],
  unit_weight_grams INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.product_variants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variant_name TEXT NOT NULL,
  sku TEXT,
  variant_image_url TEXT,
  unit_label TEXT,
  weight_grams INTEGER,
  price_adjustment NUMERIC(12, 2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SHIPPING & PROMOTIONS
CREATE TABLE public.shipping_couriers (
  id SERIAL PRIMARY KEY,
  courier_name TEXT NOT NULL,
  courier_logo_url TEXT,
  base_cost NUMERIC(12, 2),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y')),
  discount_value NUMERIC(12, 2),
  min_purchase_amount NUMERIC(12, 2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

-- 6. ORDERS
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  cashier_id UUID REFERENCES public.profiles(id),
  source order_source DEFAULT 'marketplace',
  status order_status DEFAULT 'pending',
  subtotal NUMERIC(12, 2) NOT NULL,
  shipping_fee NUMERIC(12, 2) DEFAULT 0,
  discount_amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) NOT NULL,
  shipping_courier_name TEXT,
  shipping_address_snapshot JSONB,
  invoice_url TEXT,
  packing_list_url TEXT,
  is_packing_list_downloaded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  variant_id UUID REFERENCES public.product_variants(id),
  quantity INTEGER NOT NULL,
  price_at_purchase NUMERIC(12, 2) NOT NULL
);

-- 7. NOTIFICATIONS & REVIEWS
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  action_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  product_id UUID REFERENCES public.products(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_couriers ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('master_admin', 'normal_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_kasir()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'kasir'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles" ON public.profiles
  FOR SELECT USING (is_admin() OR is_kasir());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (is_admin());

-- Pets Policies
CREATE POLICY "Users can manage own pets" ON public.pets
  FOR ALL USING (auth.uid() = owner_id);

-- Products Policies
CREATE POLICY "Public view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admins manage products" ON public.products
  FOR ALL USING (is_admin());

-- Product Variants Policies
CREATE POLICY "Public view variants" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Admins manage variants" ON public.product_variants
  FOR ALL USING (is_admin());

-- Orders Policies
CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Staff view all orders" ON public.orders
  FOR SELECT USING (is_admin() OR is_kasir());

CREATE POLICY "Users create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kasir create POS orders" ON public.orders
  FOR INSERT WITH CHECK (is_kasir() AND source = 'pos');

CREATE POLICY "Staff update orders" ON public.orders
  FOR UPDATE USING (is_admin() OR is_kasir());

-- Order Items Policies
CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Staff view all order items" ON public.order_items
  FOR SELECT USING (is_admin() OR is_kasir());

CREATE POLICY "Users create order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Staff create order items" ON public.order_items
  FOR INSERT WITH CHECK (is_admin() OR is_kasir());

-- Notifications Policies
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins view system notifications" ON public.notifications
  FOR SELECT USING (user_id IS NULL AND is_admin());

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins create notifications" ON public.notifications
  FOR INSERT WITH CHECK (is_admin());

-- Reviews Policies
CREATE POLICY "Public view approved reviews" ON public.reviews
  FOR SELECT USING (is_approved = true);

CREATE POLICY "Users create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage reviews" ON public.reviews
  FOR ALL USING (is_admin());

-- Promotions Policies
CREATE POLICY "Public view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage promotions" ON public.promotions
  FOR ALL USING (is_admin());

-- Shipping Couriers Policies
CREATE POLICY "Public view active couriers" ON public.shipping_couriers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage couriers" ON public.shipping_couriers
  FOR ALL USING (is_admin());

-- Enable Realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
