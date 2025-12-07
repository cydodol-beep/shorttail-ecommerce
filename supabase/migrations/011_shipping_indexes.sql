-- Add performance indexes for shipping couriers queries

-- Index for courier lookups
CREATE INDEX IF NOT EXISTS idx_shipping_couriers_active ON public.shipping_couriers(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_couriers_name ON public.shipping_couriers(courier_name);

-- Index for shipping rates lookups
CREATE INDEX IF NOT EXISTS idx_shipping_rates_courier ON public.shipping_rates(courier_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_province ON public.shipping_rates(province_id);
CREATE INDEX IF NOT EXISTS idx_shipping_rates_courier_province ON public.shipping_rates(courier_id, province_id);

-- Index for provinces lookups
CREATE INDEX IF NOT EXISTS idx_provinces_active ON public.provinces(is_active);
CREATE INDEX IF NOT EXISTS idx_provinces_name ON public.provinces(province_name);
