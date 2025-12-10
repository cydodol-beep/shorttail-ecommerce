-- First, let's check what columns exist in your products table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

-- Then check what columns exist in your product_variants table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'product_variants' 
ORDER BY ordinal_position;

-- Check what columns exist in your order_items table
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
ORDER BY ordinal_position;

-- Let's also see if there are any other tables that might be involved in related products
SELECT 
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%product%'
ORDER BY table_name;