-- ============================================================================
-- Advertisements Table for Dynamic Pop-up System
-- ============================================================================

-- Create advertisements table
CREATE TABLE IF NOT EXISTS public.advertisements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  image_url TEXT NOT NULL,
  redirect_link TEXT,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

-- Public can view active advertisements
CREATE POLICY "Anyone can view active advertisements" ON public.advertisements
  FOR SELECT USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Admins can manage all advertisements
CREATE POLICY "Admins can manage advertisements" ON public.advertisements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_advertisements_active ON public.advertisements(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_advertisements_display_order ON public.advertisements(display_order);

-- Add updated_at trigger
CREATE TRIGGER update_advertisements_updated_at
  BEFORE UPDATE ON public.advertisements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
