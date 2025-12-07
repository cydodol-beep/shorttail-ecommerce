-- Add QRIS payment fields to store_settings table
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS qris_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS qris_image TEXT,
ADD COLUMN IF NOT EXISTS qris_name TEXT,
ADD COLUMN IF NOT EXISTS qris_nmid TEXT;
