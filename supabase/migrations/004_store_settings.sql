-- ==============================================================================
-- Store Settings Table
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- Store Settings Table (single row for global settings)
CREATE TABLE public.store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Store Info
  store_name TEXT NOT NULL DEFAULT 'ShortTail.id',
  store_description TEXT DEFAULT 'Premium Pet Shop - Your one-stop shop for pet supplies',
  store_logo TEXT,
  store_email TEXT DEFAULT 'support@shorttail.id',
  store_phone TEXT DEFAULT '+6281234567890',
  -- Store Address
  store_address TEXT DEFAULT 'Jl. Pet Lovers No. 123',
  store_city TEXT DEFAULT 'Jakarta',
  store_province TEXT DEFAULT 'DKI Jakarta',
  store_postal_code TEXT DEFAULT '12345',
  store_currency TEXT DEFAULT 'IDR',
  store_timezone TEXT DEFAULT 'Asia/Jakarta',
  -- Shipping Settings
  free_shipping_enabled BOOLEAN DEFAULT TRUE,
  free_shipping_threshold NUMERIC(12, 2) DEFAULT 500000,
  default_shipping_fee NUMERIC(12, 2) DEFAULT 25000,
  enable_cod BOOLEAN DEFAULT TRUE,
  cod_fee NUMERIC(12, 2) DEFAULT 5000,
  processing_days INTEGER DEFAULT 2,
  -- Payment Settings
  bank_transfer_enabled BOOLEAN DEFAULT TRUE,
  bank_name TEXT DEFAULT 'BCA',
  bank_account_number TEXT DEFAULT '1234567890',
  bank_account_name TEXT DEFAULT 'PT ShortTail Indonesia',
  ewallet_enabled BOOLEAN DEFAULT TRUE,
  ewallet_provider TEXT DEFAULT 'GoPay',
  ewallet_number TEXT DEFAULT '081234567890',
  -- Loyalty Settings
  points_enabled BOOLEAN DEFAULT TRUE,
  points_per_rupiah INTEGER DEFAULT 10000,
  min_points_redeem INTEGER DEFAULT 100,
  points_value INTEGER DEFAULT 100,
  referral_bonus INTEGER DEFAULT 50,
  tier_newborn_threshold INTEGER DEFAULT 0,
  tier_transitional_threshold INTEGER DEFAULT 500,
  tier_juvenile_threshold INTEGER DEFAULT 2000,
  tier_adolescence_threshold INTEGER DEFAULT 5000,
  tier_adulthood_threshold INTEGER DEFAULT 10000,
  -- Notification Settings
  email_notifications BOOLEAN DEFAULT TRUE,
  order_confirmation BOOLEAN DEFAULT TRUE,
  order_shipped BOOLEAN DEFAULT TRUE,
  order_delivered BOOLEAN DEFAULT TRUE,
  low_stock_alert BOOLEAN DEFAULT TRUE,
  low_stock_threshold INTEGER DEFAULT 10,
  new_user_notification BOOLEAN DEFAULT TRUE,
  review_notification BOOLEAN DEFAULT TRUE,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public view store settings" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins manage store settings" ON public.store_settings
  FOR ALL USING (is_admin());

-- Updated_at trigger
CREATE TRIGGER update_store_settings_updated_at 
  BEFORE UPDATE ON public.store_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings (single row)
INSERT INTO public.store_settings (id) VALUES (gen_random_uuid());
