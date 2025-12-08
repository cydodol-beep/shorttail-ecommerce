-- Related Products System
-- Allows admin to manually set related products to cross-sell

CREATE TABLE IF NOT EXISTS product_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate relations and self-relations
  UNIQUE(product_id, related_product_id),
  CHECK (product_id != related_product_id)
);

-- Enable RLS
ALTER TABLE product_relations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view product relations"
  ON product_relations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage product relations"
  ON product_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_relations_product ON product_relations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_relations_related ON product_relations(related_product_id);
CREATE INDEX IF NOT EXISTS idx_product_relations_sort ON product_relations(product_id, sort_order);

-- Function to get related products with fallback to category-based suggestions
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
) AS $$
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
$$ LANGUAGE plpgsql;
