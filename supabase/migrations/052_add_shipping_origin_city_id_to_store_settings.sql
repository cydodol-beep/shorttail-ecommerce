-- Add shipping origin city ID to store settings for RajaOngkir integration
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS shipping_origin_city_id TEXT DEFAULT '151'; -- Jakarta Pusat as default