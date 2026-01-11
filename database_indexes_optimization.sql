-- Database Indexes Optimization for Products Page Performance
-- Run these in your Supabase SQL Editor for better query performance

-- 1. Index for products.is_active (most common filter)
CREATE INDEX IF NOT EXISTS idx_products_is_active 
ON products(is_active) 
WHERE is_active = true;

-- 2. Index for products.category_id (category filtering)
CREATE INDEX IF NOT EXISTS idx_products_category_id 
ON products(category_id) 
WHERE is_active = true;

-- 3. Composite index for category + active products
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products(category_id, is_active) 
WHERE is_active = true;

-- 4. Index for products.name (search performance with ILIKE)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);
-- Note: Requires pg_trgm extension: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 5. Index for products.base_price (sorting by price)
CREATE INDEX IF NOT EXISTS idx_products_base_price 
ON products(base_price) 
WHERE is_active = true;

-- 6. Index for products.created_at (sorting by newest)
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc 
ON products(created_at DESC) 
WHERE is_active = true;

-- 7. Index for categories.slug (lookup by slug)
CREATE INDEX IF NOT EXISTS idx_categories_slug 
ON categories(slug);

-- 8. Index for product_variants foreign key
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants(product_id);

-- Analyze tables to update statistics for query planner
ANALYZE products;
ANALYZE product_variants;
ANALYZE categories;

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('products', 'product_variants', 'categories')
ORDER BY tablename, indexname;
