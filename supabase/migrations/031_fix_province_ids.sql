-- Add rajaongkir_province_id to provinces table
ALTER TABLE public.provinces
ADD COLUMN IF NOT EXISTS rajaongkir_province_id INTEGER;

-- Update mappings based on Komerce API data
UPDATE public.provinces SET rajaongkir_province_id = 1 WHERE province_name ILIKE '%Nusa Tenggara Barat%';
UPDATE public.provinces SET rajaongkir_province_id = 2 WHERE province_name = 'Maluku';
UPDATE public.provinces SET rajaongkir_province_id = 3 WHERE province_name = 'Kalimantan Selatan';
UPDATE public.provinces SET rajaongkir_province_id = 4 WHERE province_name = 'Kalimantan Tengah';
UPDATE public.provinces SET rajaongkir_province_id = 5 WHERE province_name = 'Jawa Barat';
UPDATE public.provinces SET rajaongkir_province_id = 6 WHERE province_name = 'Bengkulu';
UPDATE public.provinces SET rajaongkir_province_id = 7 WHERE province_name = 'Kalimantan Timur';
UPDATE public.provinces SET rajaongkir_province_id = 8 WHERE province_name = 'Kepulauan Riau';
UPDATE public.provinces SET rajaongkir_province_id = 9 WHERE province_name = 'Aceh'; -- Match "Aceh" to "Nanggroe Aceh Darussalam (NAD)"
UPDATE public.provinces SET rajaongkir_province_id = 10 WHERE province_name = 'DKI Jakarta';
UPDATE public.provinces SET rajaongkir_province_id = 11 WHERE province_name = 'Banten';
UPDATE public.provinces SET rajaongkir_province_id = 12 WHERE province_name = 'Jawa Tengah';
UPDATE public.provinces SET rajaongkir_province_id = 13 WHERE province_name = 'Jambi';
UPDATE public.provinces SET rajaongkir_province_id = 14 WHERE province_name = 'Papua';
UPDATE public.provinces SET rajaongkir_province_id = 15 WHERE province_name = 'Bali';
UPDATE public.provinces SET rajaongkir_province_id = 16 WHERE province_name = 'Sumatera Utara';
UPDATE public.provinces SET rajaongkir_province_id = 17 WHERE province_name = 'Gorontalo';
UPDATE public.provinces SET rajaongkir_province_id = 18 WHERE province_name = 'Jawa Timur';
UPDATE public.provinces SET rajaongkir_province_id = 19 WHERE province_name = 'DI Yogyakarta';
UPDATE public.provinces SET rajaongkir_province_id = 20 WHERE province_name = 'Sulawesi Tenggara';
UPDATE public.provinces SET rajaongkir_province_id = 21 WHERE province_name ILIKE '%Nusa Tenggara Timur%';
UPDATE public.provinces SET rajaongkir_province_id = 22 WHERE province_name = 'Sulawesi Utara';
UPDATE public.provinces SET rajaongkir_province_id = 23 WHERE province_name = 'Sumatera Barat';
UPDATE public.provinces SET rajaongkir_province_id = 24 WHERE province_name = 'Bangka Belitung';
UPDATE public.provinces SET rajaongkir_province_id = 25 WHERE province_name = 'Riau';
UPDATE public.provinces SET rajaongkir_province_id = 26 WHERE province_name = 'Sumatera Selatan';
UPDATE public.provinces SET rajaongkir_province_id = 27 WHERE province_name = 'Sulawesi Tengah';
UPDATE public.provinces SET rajaongkir_province_id = 28 WHERE province_name = 'Kalimantan Barat';
UPDATE public.provinces SET rajaongkir_province_id = 29 WHERE province_name = 'Papua Barat';
UPDATE public.provinces SET rajaongkir_province_id = 30 WHERE province_name = 'Lampung';
UPDATE public.provinces SET rajaongkir_province_id = 31 WHERE province_name = 'Kalimantan Utara';
UPDATE public.provinces SET rajaongkir_province_id = 32 WHERE province_name = 'Maluku Utara';
UPDATE public.provinces SET rajaongkir_province_id = 33 WHERE province_name = 'Sulawesi Selatan';
UPDATE public.provinces SET rajaongkir_province_id = 34 WHERE province_name = 'Sulawesi Barat';

-- Create index
CREATE INDEX IF NOT EXISTS idx_provinces_rajaongkir_id ON public.provinces(rajaongkir_province_id);
