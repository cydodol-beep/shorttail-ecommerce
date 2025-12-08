-- Quick Fix: Update get_related_products function with SECURITY DEFINER
-- Run this in Supabase SQL Editor
-- 
-- Updates:
-- 1. Added SECURITY DEFINER to bypass RLS
-- 2. Removed stock_quantity > 0 filter (show products even if out of stock)
-- 3. Added variant price range support (min_variant_price, max_variant_price)
-- 4. Returns has_variants flag for proper price display
-- 5. Added variant stock tracking (total_variant_stock, max_variant_stock)
--    - For products with variants, uses variant stock instead of base stock
--    - Shows highest variant stock for low stock warnings

DROP FUNCTION IF EXISTS get_related_products(UUID, INTEGER);

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
    p.category,
    p.stock_quantity,
    true as is_manual,
    p.has_variants,
    COALESCE((SELECT MIN(p.base_price + pv.price_adjustment) FROM product_variants pv WHERE pv.product_id = p.id), p.base_price) as min_variant_price,
    COALESCE((SELECT MAX(p.base_price + pv.price_adjustment) FROM product_variants pv WHERE pv.product_id = p.id), p.base_price) as max_variant_price,
    COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as total_variant_stock,
    COALESCE((SELECT MAX(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as max_variant_stock
  FROM products p
  INNER JOIN product_relations pr ON p.id = pr.related_product_id
  WHERE pr.product_id = p_product_id
    AND p.is_active = true
  ORDER BY pr.sort_order, pr.created_at
  LIMIT p_limit;
  
  -- If we don't have enough manual relations, fill with category-based suggestions
  IF (SELECT COUNT(*) FROM product_relations WHERE product_id = p_product_id) < p_limit THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.name,
      p.base_price,
      p.main_image_url,
      p.category,
      p.stock_quantity,
      false as is_manual,
      p.has_variants,
      COALESCE((SELECT MIN(p.base_price + pv.price_adjustment) FROM product_variants pv WHERE pv.product_id = p.id), p.base_price) as min_variant_price,
      COALESCE((SELECT MAX(p.base_price + pv.price_adjustment) FROM product_variants pv WHERE pv.product_id = p.id), p.base_price) as max_variant_price,
      COALESCE((SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as total_variant_stock,
      COALESCE((SELECT MAX(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id), 0) as max_variant_stock
    FROM products p
    WHERE p.id != p_product_id
      AND p.category = (SELECT category FROM products WHERE id = p_product_id)
      AND p.is_active = true
      AND p.id NOT IN (
        SELECT related_product_id 
        FROM product_relations 
        WHERE product_id = p_product_id
      )
    ORDER BY RANDOM()
    LIMIT p_limit - (SELECT COUNT(*) FROM product_relations WHERE product_id = p_product_id);
  END IF;
END;
$$;
