-- Additional Performance Indexes for Optimized Queries
-- Run this to improve database query performance

-- Composite index for products active status with created_at for faster featured products query
CREATE INDEX IF NOT EXISTS idx_products_active_created ON public.products(is_active, created_at DESC) WHERE is_active = true;

-- Index for product stock queries
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock_quantity) WHERE is_active = true;

-- Index for promotions active and date filtering
CREATE INDEX IF NOT EXISTS idx_promotions_active_dates ON public.promotions(is_active, start_date, end_date) WHERE is_active = true;

-- Index for landing page sections
CREATE INDEX IF NOT EXISTS idx_landing_sections_visible_order ON public.landing_page_sections(is_visible, sort_order);

-- Index for order items with product lookup
CREATE INDEX IF NOT EXISTS idx_order_items_product ON public.order_items(product_id);

-- Index for profiles with role filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Index for reviews with product lookup
CREATE INDEX IF NOT EXISTS idx_reviews_product_approved ON public.reviews(product_id, is_approved);

-- Partial index for pending orders (faster admin queries)
CREATE INDEX IF NOT EXISTS idx_orders_pending ON public.orders(status, created_at DESC) WHERE status = 'pending';

-- Partial index for delivered orders (faster revenue calculations)
CREATE INDEX IF NOT EXISTS idx_orders_delivered ON public.orders(status, created_at DESC) WHERE status = 'delivered';

-- Index for wishlists user lookup
CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);

-- Analyze tables to update statistics for query planner
ANALYZE public.products;
ANALYZE public.categories;
ANALYZE public.orders;
ANALYZE public.promotions;
ANALYZE public.product_variants;
