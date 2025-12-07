-- ==============================================================================
-- Social Media Links Table
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- Social Media Links Table
CREATE TABLE public.social_media_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public view active social links" ON public.social_media_links
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage social links" ON public.social_media_links
  FOR ALL USING (is_admin());

-- Updated_at trigger
CREATE TRIGGER update_social_media_links_updated_at 
  BEFORE UPDATE ON public.social_media_links 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default social media links
INSERT INTO public.social_media_links (platform, url, icon, display_order, is_active) VALUES
  ('Facebook', 'https://facebook.com', 'facebook', 1, true),
  ('Instagram', 'https://instagram.com', 'instagram', 2, true),
  ('Twitter', 'https://twitter.com', 'twitter', 3, true);
