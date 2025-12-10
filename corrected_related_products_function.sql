-- Corrected version of the get_related_products function to fix 'category' column ambiguity
-- This resolves the issue where multiple tables have a 'category' column without proper qualification
-- Run this in your Supabase SQL Editor

-- First, drop the existing function
DROP FUNCTION IF EXISTS get_related_products(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_related_products(UUID);
DROP FUNCTION IF EXISTS get_related_products;

-- Create the corrected function with proper column qualification
CREATE OR REPLACE FUNCTION get_related_products(
  p_product_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  base_price NUMERIC,
  main_image_url TEXT,
  category TEXT,
  stock_quantity INTEGER,
  is_manual BOOLEAN,
  has_variants BOOLEAN,
  min_variant_price NUMERIC,
  max_variant_price NUMERIC,
  total_variant_stock BIGINT,
  max_variant_stock BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  manual_count INTEGER;
BEGIN
  -- First, get manually set related products
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.base_price,
    p.main_image_url,
    p.category,  -- Fully qualified as p.category
    p.stock_quantity,
    true as is_manual,
    p.has_variants,
    COALESCE((SELECT MIN(p.base_price + pv.price_adjustment) 
              FROM product_variants pv 
              WHERE pv.product_id = p.id), p.base_price) as min_variant_price,
    COALESCE((SELECT MAX(p.base_price + pv.price_adjustment) 
              FROM product_variants pv 
              WHERE pv.product_id = p.id), p.base_price) as max_variant_price,
    COALESCE((SELECT SUM(pv.stock_quantity) 
              FROM product_variants pv 
              WHERE pv.product_id = p.id), 0::BIGINT) as total_variant_stock,
    COALESCE((SELECT MAX(pv.stock_quantity) 
              FROM product_variants pv 
              WHERE pv.product_id = p.id), 0::BIGINT) as max_variant_stock
  FROM products p
  INNER JOIN product_relations pr ON p.id = pr.related_product_id
  WHERE pr.product_id = p_product_id
    AND p.is_active = true
  ORDER BY pr.sort_order, pr.created_at
  LIMIT p_limit;

  -- Get count of manual relations returned
  SELECT COUNT(*) INTO manual_count
  FROM (
    SELECT p.id
    FROM products p
    INNER JOIN product_relations pr ON p.id = pr.related_product_id
    WHERE pr.product_id = p_product_id
      AND p.is_active = true
    LIMIT p_limit
  ) manual_results;

  -- If we need more products to reach the limit, get category-based suggestions
  IF manual_count < p_limit THEN
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.base_price,
      p.main_image_url,
      p.category,  -- Fully qualified as p.category to avoid ambiguity
      p.stock_quantity,
      false as is_manual,
      p.has_variants,
      COALESCE((SELECT MIN(p.base_price + pv.price_adjustment) 
                FROM product_variants pv 
                WHERE pv.product_id = p.id), p.base_price) as min_variant_price,
      COALESCE((SELECT MAX(p.base_price + pv.price_adjustment) 
                FROM product_variants pv 
                WHERE pv.product_id = p.id), p.base_price) as max_variant_price,
      COALESCE((SELECT SUM(pv.stock_quantity) 
                FROM product_variants pv 
                WHERE pv.product_id = p.id), 0::BIGINT) as total_variant_stock,
      COALESCE((SELECT MAX(pv.stock_quantity) 
                FROM product_variants pv 
                WHERE pv.product_id = p.id), 0::BIGINT) as max_variant_stock
    FROM products p
    WHERE p.id != p_product_id
      AND p.category = (SELECT p2.category FROM products p2 WHERE p2.id = p_product_id)  -- Fully qualify p2.category
      AND p.is_active = true
      AND p.id NOT IN (
        SELECT related_product_id
        FROM product_relations
        WHERE product_id = p_product_id
      )
    ORDER BY RANDOM()
    LIMIT (p_limit - manual_count);  -- Only get as many as we need
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_related_products TO authenticated, anon;

-- Create a backup of the current function structure for reference
-- Original structure was based on the existing migration file that had the working function