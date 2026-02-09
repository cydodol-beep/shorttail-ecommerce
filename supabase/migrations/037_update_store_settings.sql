-- ==============================================================================
-- Update Store Settings with ShortTail.id data
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- Update the store settings with actual ShortTail.id information
UPDATE public.store_settings
SET 
  store_name = 'ShortTail.id',
  store_description = 'ShortTail.id menyediakan produk makanan anjing natural yang berkualitas tinggi untuk kesehatan optimal hewan peliharaan Anda. Kami berkomitmen memberikan nutrisi terbaik untuk sahabat berbulu Anda sejak tahun 2021.',
  store_email = 'shorttail.id@gmail.com',
  store_phone = '+6287888177362',
  store_address = 'Edutown BSD',
  store_city = 'Kab. Tangerang',
  store_province = 'Banten',
  store_postal_code = '15331',
  store_currency = 'IDR',
  store_timezone = 'Asia/Jakarta',
  -- Shipping Settings
  free_shipping_enabled = TRUE,
  free_shipping_threshold = 10000.00,
  default_shipping_fee = 10000.00,
  enable_cod = FALSE,
  cod_fee = 0,
  processing_days = 1,
  -- Payment Settings
  bank_transfer_enabled = TRUE,
  bank_name = 'BCA',
  bank_account_number = '8735472428',
  bank_account_name = 'Cynthia Olivia',
  ewallet_enabled = FALSE,
  ewallet_provider = '',
  ewallet_number = '',
  -- Loyalty Settings
  points_enabled = TRUE,
  points_per_rupiah = 10000,
  min_points_redeem = 1,
  points_value = 1,
  referral_bonus = 0,
  tier_newborn_threshold = 0,
  tier_transitional_threshold = 500,
  tier_juvenile_threshold = 2000,
  tier_adolescence_threshold = 5000,
  tier_adulthood_threshold = 10000,
  -- Notification Settings
  email_notifications = TRUE,
  order_confirmation = TRUE,
  order_shipped = TRUE,
  order_delivered = TRUE,
  low_stock_alert = TRUE,
  low_stock_threshold = 5,
  new_user_notification = TRUE,
  review_notification = TRUE,
  updated_at = NOW()
WHERE id = (SELECT id FROM public.store_settings LIMIT 1);

-- Note: The store_logo field contains a large base64 image.
-- Due to size limitations, you should upload it through the Admin Settings page UI
-- or use a separate UPDATE statement with the full base64 data.
