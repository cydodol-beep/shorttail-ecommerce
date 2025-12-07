-- Create province-based shipping cost system
-- This allows each courier to have different costs per province

-- 1. Create provinces table for Indonesia
CREATE TABLE IF NOT EXISTS public.provinces (
  id SERIAL PRIMARY KEY,
  province_name TEXT UNIQUE NOT NULL,
  province_code TEXT UNIQUE,
  is_active BOOLEAN DEFAULT TRUE
);

-- 2. Create shipping rates table (courier-specific rates per province)
CREATE TABLE IF NOT EXISTS public.shipping_rates (
  id SERIAL PRIMARY KEY,
  courier_id INTEGER REFERENCES public.shipping_couriers(id) ON DELETE CASCADE,
  province_id INTEGER REFERENCES public.provinces(id) ON DELETE CASCADE,
  cost NUMERIC(12, 2) NOT NULL,
  estimated_days TEXT, -- e.g., "2-3 days"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(courier_id, province_id)
);

-- Enable RLS
ALTER TABLE public.provinces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Provinces policies (public can view, admins can manage)
CREATE POLICY "Public view active provinces" ON public.provinces
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins view all provinces" ON public.provinces
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

CREATE POLICY "Admins manage provinces" ON public.provinces
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Shipping rates policies
CREATE POLICY "Public view shipping rates" ON public.shipping_rates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.shipping_couriers
      WHERE shipping_couriers.id = shipping_rates.courier_id
      AND shipping_couriers.is_active = true
    )
  );

CREATE POLICY "Admins manage shipping rates" ON public.shipping_rates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Insert Indonesia provinces (34 provinces)
INSERT INTO public.provinces (province_name, province_code) VALUES
  ('Aceh', 'AC'),
  ('Bali', 'BA'),
  ('Bangka Belitung', 'BB'),
  ('Banten', 'BT'),
  ('Bengkulu', 'BE'),
  ('DI Yogyakarta', 'YO'),
  ('DKI Jakarta', 'JK'),
  ('Gorontalo', 'GO'),
  ('Jambi', 'JA'),
  ('Jawa Barat', 'JB'),
  ('Jawa Tengah', 'JT'),
  ('Jawa Timur', 'JI'),
  ('Kalimantan Barat', 'KB'),
  ('Kalimantan Selatan', 'KS'),
  ('Kalimantan Tengah', 'KT'),
  ('Kalimantan Timur', 'KI'),
  ('Kalimantan Utara', 'KU'),
  ('Kepulauan Riau', 'KR'),
  ('Lampung', 'LA'),
  ('Maluku', 'MA'),
  ('Maluku Utara', 'MU'),
  ('Nusa Tenggara Barat', 'NB'),
  ('Nusa Tenggara Timur', 'NT'),
  ('Papua', 'PA'),
  ('Papua Barat', 'PB'),
  ('Papua Barat Daya', 'PD'),
  ('Papua Pegunungan', 'PP'),
  ('Papua Selatan', 'PS'),
  ('Papua Tengah', 'PT'),
  ('Riau', 'RI'),
  ('Sulawesi Barat', 'SR'),
  ('Sulawesi Selatan', 'SN'),
  ('Sulawesi Tengah', 'ST'),
  ('Sulawesi Tenggara', 'SG'),
  ('Sulawesi Utara', 'SA'),
  ('Sumatera Barat', 'SB'),
  ('Sumatera Selatan', 'SS'),
  ('Sumatera Utara', 'SU')
ON CONFLICT (province_name) DO NOTHING;

-- Add updated_at trigger
CREATE TRIGGER update_shipping_rates_updated_at
  BEFORE UPDATE ON public.shipping_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate shipping cost
CREATE OR REPLACE FUNCTION calculate_shipping_cost(
  p_courier_id INTEGER,
  p_province_name TEXT
) RETURNS TABLE (
  courier_name TEXT,
  cost NUMERIC,
  estimated_days TEXT,
  base_cost NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.courier_name,
    COALESCE(sr.cost, sc.base_cost) as cost,
    sr.estimated_days,
    sc.base_cost
  FROM public.shipping_couriers sc
  LEFT JOIN public.shipping_rates sr ON sr.courier_id = sc.id
  LEFT JOIN public.provinces p ON p.id = sr.province_id AND LOWER(p.province_name) = LOWER(p_province_name)
  WHERE sc.id = p_courier_id
    AND sc.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all available couriers for a province
CREATE OR REPLACE FUNCTION get_couriers_for_province(
  p_province_name TEXT
) RETURNS TABLE (
  courier_id INTEGER,
  courier_name TEXT,
  courier_logo_url TEXT,
  cost NUMERIC,
  estimated_days TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id as courier_id,
    sc.courier_name,
    sc.courier_logo_url,
    COALESCE(sr.cost, sc.base_cost) as cost,
    sr.estimated_days
  FROM public.shipping_couriers sc
  LEFT JOIN public.shipping_rates sr ON sr.courier_id = sc.id
  LEFT JOIN public.provinces p ON p.id = sr.province_id AND LOWER(p.province_name) = LOWER(p_province_name)
  WHERE sc.is_active = true
  ORDER BY COALESCE(sr.cost, sc.base_cost) ASC;
END;
$$ LANGUAGE plpgsql;
