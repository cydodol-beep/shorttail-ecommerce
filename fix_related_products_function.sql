-- Fix the get_related_products function to resolve 'category' column ambiguity
-- This error occurs when multiple joined tables have a 'category' column and it's not properly qualified

-- First, let's drop the existing function
DROP FUNCTION IF EXISTS get_related_products(uuid, integer);

-- Now recreate the function with proper column qualification
CREATE OR REPLACE FUNCTION get_related_products(p_product_id uuid, p_limit integer DEFAULT 5)
RETURNS TABLE(
    id uuid,
    name text,
    main_image_url text,
    base_price numeric,
    stock_quantity integer,
    has_variants boolean,
    condition text,
    category text,
    is_active boolean,
    created_at timestamptz,
    min_variant_price numeric,
    max_variant_price numeric,
    total_variant_stock integer,
    max_variant_stock integer,
    is_manual boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH product_info AS (
        SELECT 
            p.category AS product_category  -- Qualify the category column from the products table
        FROM products p 
        WHERE p.id = p_product_id
    ),
    -- Find related products: same category, different product
    related_by_category AS (
        SELECT DISTINCT
            p.id,
            p.name,
            p.main_image_url,
            p.base_price,
            p.stock_quantity,
            p.has_variants,
            p.condition,
            p.category,
            p.is_active,
            p.created_at,
            -- Variant information
            MIN(pv.price_adjustment) AS min_variant_price,
            MAX(pv.price_adjustment) AS max_variant_price,
            SUM(pv.stock_quantity) AS total_variant_stock,
            MAX(pv.stock_quantity) AS max_variant_stock,
            false AS is_manual
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        JOIN product_info pi ON p.category = pi.product_category  -- Use qualified column reference
        WHERE p.id != p_product_id  -- Exclude the original product
          AND p.is_active = true
        GROUP BY p.id, p.name, p.main_image_url, p.base_price, p.stock_quantity, 
                 p.has_variants, p.condition, p.category, p.is_active, p.created_at
        ORDER BY RANDOM()
        LIMIT p_limit
    ),
    -- Find related products: recently ordered together with the current product
    related_by_orders AS (
        SELECT DISTINCT
            p.id,
            p.name,
            p.main_image_url,
            p.base_price,
            p.stock_quantity,
            p.has_variants,
            p.condition,
            p.category,
            p.is_active,
            p.created_at,
            -- Variant information
            MIN(pv.price_adjustment) AS min_variant_price,
            MAX(pv.price_adjustment) AS max_variant_price,
            SUM(pv.stock_quantity) AS total_variant_stock,
            MAX(pv.stock_quantity) AS max_variant_stock,
            true AS is_manual
        FROM order_items oi_current
        JOIN order_items oi_related ON oi_current.order_id = oi_related.order_id
        JOIN products p ON oi_related.product_id = p.id
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        WHERE oi_current.product_id = p_product_id
          AND oi_related.product_id != p_product_id  -- Exclude the original product
          AND p.is_active = true
        GROUP BY p.id, p.name, p.main_image_url, p.base_price, p.stock_quantity, 
                 p.has_variants, p.condition, p.category, p.is_active, p.created_at
        ORDER BY RANDOM()
        LIMIT GREATEST(1, p_limit / 2)  -- Get fewer items from this source
    )
    -- Combine both sources
    SELECT 
        id, name, main_image_url, base_price, stock_quantity, has_variants, 
        condition, category, is_active, created_at, min_variant_price, 
        max_variant_price, total_variant_stock, max_variant_stock, is_manual
    FROM (
        SELECT * FROM related_by_category
        UNION
        SELECT * FROM related_by_orders
    ) combined
    ORDER BY is_manual DESC, RANDOM()  -- Prefer manually related items first
    LIMIT p_limit;
END;
$$;

-- Also create a function that gets related products for multiple product IDs
CREATE OR REPLACE FUNCTION get_related_products_multi(p_product_ids uuid[], p_limit integer DEFAULT 5)
RETURNS TABLE(
    id uuid,
    name text,
    main_image_url text,
    base_price numeric,
    stock_quantity integer,
    has_variants boolean,
    condition text,
    category text,
    is_active boolean,
    created_at timestamptz,
    min_variant_price numeric,
    max_variant_price numeric,
    total_variant_stock integer,
    max_variant_stock integer,
    is_manual boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH product_categories AS (
        -- Get categories for all the input product IDs
        SELECT DISTINCT p.category AS product_category
        FROM products p
        WHERE p.id = ANY(p_product_ids)
    ),
    -- Find related products: same category as any of the cart products
    related_by_categories AS (
        SELECT DISTINCT
            p.id,
            p.name,
            p.main_image_url,
            p.base_price,
            p.stock_quantity,
            p.has_variants,
            p.condition,
            p.category,
            p.is_active,
            p.created_at,
            -- Variant information
            MIN(pv.price_adjustment) AS min_variant_price,
            MAX(pv.price_adjustment) AS max_variant_price,
            SUM(pv.stock_quantity) AS total_variant_stock,
            MAX(pv.stock_quantity) AS max_variant_stock,
            false AS is_manual
        FROM products p
        LEFT JOIN product_variants pv ON p.id = pv.product_id
        JOIN product_categories pc ON p.category = pc.product_category  -- Use qualified column reference
        WHERE p.id != ALL(p_product_ids)  -- Exclude all original products
          AND p.is_active = true
        GROUP BY p.id, p.name, p.main_image_url, p.base_price, p.stock_quantity, 
                 p.has_variants, p.condition, p.category, p.is_active, p.created_at
        ORDER BY RANDOM()
        LIMIT p_limit
    )
    SELECT 
        id, name, main_image_url, base_price, stock_quantity, has_variants, 
        condition, category, is_active, created_at, min_variant_price, 
        max_variant_price, total_variant_stock, max_variant_stock, is_manual
    FROM related_by_categories;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_related_products TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_related_products_multi TO authenticated, anon;

-- Verify the functions are working
-- SELECT * FROM get_related_products('YOUR_PRODUCT_ID_HERE', 5) LIMIT 5;