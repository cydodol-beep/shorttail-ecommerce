-- Database Indexes Optimization for Products Page Performance
-- Run these in your Supabase SQL Editor for better query performance

-- Enable pg_trgm extension for fuzzy string matching (for ILIKE performance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Index for products.is_active (most common filter)
CREATE INDEX IF NOT EXISTS idx_products_is_active 
ON products(is_active) 
WHERE is_active = true;

-- 2. Composite index for category + active products (covers category filtering)
CREATE INDEX IF NOT EXISTS idx_products_category_active 
ON products(category_id, is_active) 
WHERE is_active = true;

-- 3. Index for products.name (search performance with ILIKE)
CREATE INDEX IF NOT EXISTS idx_products_name_trgm 
ON products USING gin(name gin_trgm_ops);

-- 4. Index for products.base_price (sorting by price)
CREATE INDEX IF NOT EXISTS idx_products_base_price 
ON products(base_price) 
WHERE is_active = true;

-- 5. Index for products.created_at (sorting by newest)
CREATE INDEX IF NOT EXISTS idx_products_created_at_desc 
ON products(created_at DESC) 
WHERE is_active = true;

-- 6. Index for product_variants foreign key
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

-- Cleanup: Drop redundant indexes
-- These indexes are now covered by more specific or unique indexes created above.
DROP INDEX IF EXISTS idx_categories_slug;
DROP INDEX IF EXISTS idx_products_category_id;
DROP INDEX IF EXISTS idx_products_created_at;
