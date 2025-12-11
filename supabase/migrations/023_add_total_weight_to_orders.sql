-- Add total_weight_grams column to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_weight_grams INTEGER;