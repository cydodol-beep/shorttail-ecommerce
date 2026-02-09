-- Create cities table to store RajaOngkir cities
CREATE TABLE IF NOT EXISTS public.cities (
    id INTEGER PRIMARY KEY, -- Use RajaOngkir City ID directly
    province_id INTEGER REFERENCES public.provinces(id),
    city_name TEXT NOT NULL,
    postal_code TEXT,
    type TEXT, -- "Kota" or "Kabupaten" (stored as "Kabupaten" or "Kota")
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add city_id columns to profiles table WITHOUT strict FK for flexibility with API data
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS city_id INTEGER, -- Removed REFERENCES to avoid insert errors if cities table empty
ADD COLUMN IF NOT EXISTS recipient_city_id INTEGER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cities_province_id ON public.cities(province_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON public.profiles(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_recipient_city_id ON public.profiles(recipient_city_id);

-- RLS Policies
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are viewable by everyone" ON public.cities
    FOR SELECT USING (true);

CREATE POLICY "Admins can insert/update cities" ON public.cities
    FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'admin'); -- Adjust based on your role logic
