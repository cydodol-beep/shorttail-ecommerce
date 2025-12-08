-- Quick Fix: Update get_related_products function with SECURITY DEFINER
-- Run this in Supabase SQL Editor

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
  is_manual BOOLEAN
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
    true as is_manual
  FROM products p
  INNER JOIN product_relations pr ON p.id = pr.related_product_id
  WHERE pr.product_id = p_product_id
    AND p.is_active = true
    AND p.stock_quantity > 0
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
      false as is_manual
    FROM products p
    WHERE p.id != p_product_id
      AND p.category = (SELECT category FROM products WHERE id = p_product_id)
      AND p.is_active = true
      AND p.stock_quantity > 0
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
