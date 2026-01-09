-- Add city columns to orders table for RajaOngkir integration
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS recipient_city TEXT,
ADD COLUMN IF NOT EXISTS destination_city_id INTEGER; -- To store RajaOngkir city ID

-- Add index for reporting/analytics
CREATE INDEX IF NOT EXISTS idx_orders_destination_city_id ON public.orders(destination_city_id);

COMMENT ON COLUMN public.orders.recipient_city IS 'City name of the recipient';
COMMENT ON COLUMN public.orders.destination_city_id IS 'RajaOngkir City ID for precise tracking';
