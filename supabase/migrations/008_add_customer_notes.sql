-- Add customer notes field to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_notes TEXT;

COMMENT ON COLUMN public.orders.customer_notes IS 'Special requests or notes from customer or POS cashier';
