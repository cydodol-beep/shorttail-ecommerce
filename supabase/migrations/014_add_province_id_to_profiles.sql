-- Add province_id columns to profiles table
-- This allows storing province references instead of text for better shipping calculation

-- Add province_id for personal address
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS province_id INTEGER REFERENCES public.provinces(id);

-- Add province_id for recipient address
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS recipient_province_id INTEGER REFERENCES public.provinces(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_province_id ON public.profiles(province_id);
CREATE INDEX IF NOT EXISTS idx_profiles_recipient_province_id ON public.profiles(recipient_province_id);

-- Optional: Migrate existing text data to province_id (if you have existing data)
-- This will try to match existing region_state_province text to province names
UPDATE public.profiles p
SET province_id = (
  SELECT pr.id 
  FROM public.provinces pr 
  WHERE LOWER(TRIM(pr.province_name)) = LOWER(TRIM(p.region_state_province))
  LIMIT 1
)
WHERE p.region_state_province IS NOT NULL 
  AND p.province_id IS NULL;

-- Migrate recipient_region to recipient_province_id
UPDATE public.profiles p
SET recipient_province_id = (
  SELECT pr.id 
  FROM public.provinces pr 
  WHERE LOWER(TRIM(pr.province_name)) = LOWER(TRIM(p.recipient_region))
  LIMIT 1
)
WHERE p.recipient_region IS NOT NULL 
  AND p.recipient_province_id IS NULL;
