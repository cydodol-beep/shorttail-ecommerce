-- Update the get_related_products function to resolve 'category' column ambiguity
-- This fixes the issue where multiple tables have a 'category' column causing ambiguity
-- Run this in your Supabase SQL Editor

-- First, drop the existing function
DROP FUNCTION IF EXISTS get_related_products(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_related_products(UUID);
DROP FUNCTION IF EXISTS get_related_products;

-- Create the updated function with proper column qualification
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
BEGIN
  -- First, try to get manually set related products
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.base_price,
    p.main_image_url,
    p.category,  -- Fully qualify with table alias 'p'
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
  FROM products p  -- Explicitly alias as 'p'
  INNER JOIN product_relations pr ON p.id = pr.related_product_id
  WHERE pr.product_id = p_product_id
    AND p.is_active = true
  ORDER BY pr.sort_order, pr.created_at
  LIMIT p_limit;

  -- If we don't have enough manual relations, fill with category-based suggestions
  -- Only execute if first query didn't return the limit
  IF NOT FOUND OR (SELECT COUNT(*) FROM (
    SELECT 1 FROM products p
    INNER JOIN product_relations pr ON p.id = pr.related_product_id
    WHERE pr.product_id = p_product_id
      AND p.is_active = true
    LIMIT p_limit
  ) AS subquery) < p_limit THEN
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      p.base_price,
      p.main_image_url,
      p.category,  -- Fully qualify with table alias 'p'
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
    FROM products p  -- Explicitly alias as 'p'
    WHERE p.id != p_product_id
      AND p.category = (SELECT p2.category FROM products p2 WHERE p2.id = p_product_id)  -- Fully qualify reference
      AND p.is_active = true
      AND p.id NOT IN (
        SELECT related_product_id
        FROM product_relations
        WHERE product_id = p_product_id
      )
    ORDER BY RANDOM()
    LIMIT GREATEST(1, p_limit - COALESCE((
      SELECT COUNT(*) 
      FROM products p_sub
      INNER JOIN product_relations pr_sub ON p_sub.id = pr_sub.related_product_id
      WHERE pr_sub.product_id = p_product_id
        AND p_sub.is_active = true
      LIMIT p_limit
    ), 0));
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_related_products TO authenticated, anon;

-- Test the function
-- SELECT * FROM get_related_products('some-product-id', 5);