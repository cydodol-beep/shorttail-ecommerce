-- Fix foreign key constraint to allow variant deletion
-- When a variant is deleted, set the variant_id to NULL in order_items
-- This preserves order history while allowing variant management

-- Drop the existing foreign key constraint
ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_variant_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_variant_id_fkey 
  FOREIGN KEY (variant_id) 
  REFERENCES public.product_variants(id) 
  ON DELETE SET NULL;

-- Add a column to store variant name at time of purchase (for historical reference)
ALTER TABLE public.order_items 
  ADD COLUMN IF NOT EXISTS variant_name_snapshot TEXT;

-- Update existing order items to capture variant names before any deletions
UPDATE public.order_items oi
SET variant_name_snapshot = pv.variant_name
FROM public.product_variants pv
WHERE oi.variant_id = pv.id 
  AND oi.variant_name_snapshot IS NULL;
