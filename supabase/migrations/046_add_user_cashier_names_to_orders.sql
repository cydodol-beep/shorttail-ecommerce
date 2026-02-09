-- Add user_name and cashier_name columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS user_name TEXT,
ADD COLUMN IF NOT EXISTS cashier_name TEXT;

COMMENT ON COLUMN public.orders.user_name IS 'User name at time of order creation for display purposes';
COMMENT ON COLUMN public.orders.cashier_name IS 'Cashier name at time of POS order creation for display purposes';