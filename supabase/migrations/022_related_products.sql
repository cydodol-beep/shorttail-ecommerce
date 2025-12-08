-- Add related_product_ids column to products table
-- This allows admins to manually select up to 5 related products for cross-selling

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS related_product_ids UUID[] DEFAULT '{}';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_related_product_ids 
ON public.products USING GIN (related_product_ids);

-- Comment for documentation
COMMENT ON COLUMN public.products.related_product_ids IS 'Array of product IDs manually selected as related products for cross-selling (max 5)';
