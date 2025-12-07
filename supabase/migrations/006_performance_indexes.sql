-- ==============================================================================
-- Performance Indexes
-- Run this in your Supabase SQL Editor to improve query performance
-- ==============================================================================

-- Products table indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category_active ON public.products(category, is_active);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- Product variants index
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Profiles index for is_admin() function performance
CREATE INDEX IF NOT EXISTS idx_profiles_role_lookup ON public.profiles(id, role) WHERE role IN ('master_admin', 'normal_admin');
