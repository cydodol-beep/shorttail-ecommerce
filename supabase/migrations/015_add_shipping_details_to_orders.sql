-- Add shipping and recipient details to orders table for better tracking
-- This allows storing detailed shipping information for each order

-- Add recipient details
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS recipient_name TEXT,
ADD COLUMN IF NOT EXISTS recipient_phone TEXT,
ADD COLUMN IF NOT EXISTS recipient_address TEXT,
ADD COLUMN IF NOT EXISTS recipient_province TEXT,
ADD COLUMN IF NOT EXISTS recipient_province_id INTEGER REFERENCES public.provinces(id);

-- Add shipping details
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_courier TEXT,
ADD COLUMN IF NOT EXISTS shipping_weight_grams INTEGER,
ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_recipient_province_id ON public.orders(recipient_province_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN public.orders.recipient_name IS 'Name of the recipient for delivery';
COMMENT ON COLUMN public.orders.recipient_phone IS 'Phone number of the recipient';
COMMENT ON COLUMN public.orders.recipient_address IS 'Full delivery address';
COMMENT ON COLUMN public.orders.recipient_province IS 'Province name for display';
COMMENT ON COLUMN public.orders.recipient_province_id IS 'Reference to provinces table for shipping calculation';
COMMENT ON COLUMN public.orders.shipping_courier IS 'Courier service name used for delivery';
COMMENT ON COLUMN public.orders.shipping_weight_grams IS 'Total weight of the order in grams';
COMMENT ON COLUMN public.orders.payment_method IS 'Payment method used (cash, card, etc.)';
