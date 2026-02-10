-- ============================================================================
-- Enhanced Advertisements System for Marketplace
-- ============================================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS public.ad_impressions CASCADE;
DROP TABLE IF EXISTS public.advertisement_campaigns CASCADE;

-- Create advertisement campaigns table (enhanced from basic advertisements)
CREATE TABLE IF NOT EXISTS public.advertisement_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  image_srcset JSONB DEFAULT '[]'::jsonb,
  link_url TEXT,
  
  -- Position and placement
  position TEXT NOT NULL CHECK (position IN ('sidebar', 'interstitial', 'banner', 'popup')),
  
  -- Scheduling
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  
  -- Status and priority
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'draft', 'expired')),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  -- Targeting
  target_audience JSONB DEFAULT '{}'::jsonb, -- { device_types: ['mobile', 'desktop'], user_tiers: ['premium'], pet_types: ['dog', 'cat'] }
  ab_test_group TEXT CHECK (ab_test_group IN ('A', 'B', 'control')),
  
  -- Statistics
  impression_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ad impressions tracking table
CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id UUID NOT NULL REFERENCES public.advertisement_campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Tracking data
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  clicked BOOLEAN DEFAULT false,
  click_timestamp TIMESTAMPTZ,
  
  -- Device and context info
  device_type TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  page_url TEXT,
  
  -- A/B test tracking
  ab_test_group TEXT
);

-- Enable RLS on both tables
ALTER TABLE public.advertisement_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for advertisement_campaigns
-- ============================================================================

-- Anyone can view active advertisements (for public access)
DROP POLICY IF EXISTS "Anyone can view active advertisements" ON public.advertisement_campaigns;
CREATE POLICY "Anyone can view active advertisements" ON public.advertisement_campaigns
  FOR SELECT USING (
    is_active = true
    AND status = 'active'
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  );

-- Admins can manage all advertisements
DROP POLICY IF EXISTS "Admins can manage advertisements" ON public.advertisement_campaigns;
CREATE POLICY "Admins can manage advertisements" ON public.advertisement_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- ============================================================================
-- RLS Policies for ad_impressions
-- ============================================================================

-- Users can create impressions (for tracking)
DROP POLICY IF EXISTS "Users can create impressions" ON public.ad_impressions;
CREATE POLICY "Users can create impressions" ON public.ad_impressions
  FOR INSERT WITH CHECK (true);

-- Admins can view all impressions
DROP POLICY IF EXISTS "Admins can view impressions" ON public.ad_impressions;
CREATE POLICY "Admins can view impressions" ON public.ad_impressions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('master_admin', 'normal_admin')
    )
  );

-- Users can view their own impressions
DROP POLICY IF EXISTS "Users can view own impressions" ON public.ad_impressions;
CREATE POLICY "Users can view own impressions" ON public.ad_impressions
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- Indexes for performance
-- ============================================================================

-- Indexes for advertisement_campaigns
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active ON public.advertisement_campaigns(is_active, status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_position ON public.advertisement_campaigns(position);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON public.advertisement_campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_priority ON public.advertisement_campaigns(priority DESC);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_ab_test ON public.advertisement_campaigns(ab_test_group);

-- Composite index for fetching active ads by position
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_active_position 
  ON public.advertisement_campaigns(is_active, status, position, priority DESC);

-- Indexes for ad_impressions
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_id ON public.ad_impressions(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_user_id ON public.ad_impressions(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_timestamp ON public.ad_impressions(timestamp);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_session ON public.ad_impressions(session_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_clicked ON public.ad_impressions(ad_id, clicked);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to calculate CTR for an ad
CREATE OR REPLACE FUNCTION public.calculate_ad_ctr(ad_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  impressions INTEGER;
  clicks INTEGER;
  ctr NUMERIC;
BEGIN
  SELECT impression_count, click_count 
  INTO impressions, clicks
  FROM public.advertisement_campaigns
  WHERE id = ad_uuid;
  
  IF impressions = 0 OR impressions IS NULL THEN
    RETURN 0;
  END IF;
  
  ctr := (clicks::NUMERIC / impressions::NUMERIC) * 100;
  RETURN ROUND(ctr, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment impression count
CREATE OR REPLACE FUNCTION public.increment_ad_impression(ad_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.advertisement_campaigns
  SET impression_count = impression_count + 1
  WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment click count
CREATE OR REPLACE FUNCTION public.increment_ad_click(ad_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.advertisement_campaigns
  SET click_count = click_count + 1
  WHERE id = ad_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active ads by position
CREATE OR REPLACE FUNCTION public.get_active_ads_by_position(
  ad_position TEXT,
  user_device_type TEXT DEFAULT NULL,
  user_tier TEXT DEFAULT NULL
)
RETURNS SETOF public.advertisement_campaigns AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.advertisement_campaigns
  WHERE is_active = true
    AND status = 'active'
    AND position = ad_position
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
    AND (
      target_audience = '{}'::jsonb
      OR target_audience IS NULL
      OR (
        -- Device type filtering
        (user_device_type IS NULL OR 
         NOT (target_audience ? 'device_types') OR
         (target_audience->'device_types') @> to_jsonb(user_device_type))
        AND
        -- User tier filtering
        (user_tier IS NULL OR 
         NOT (target_audience ? 'user_tiers') OR
         (target_audience->'user_tiers') @> to_jsonb(user_tier))
      )
    )
  ORDER BY priority DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_ad_campaigns_updated_at ON public.advertisement_campaigns;
CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON public.advertisement_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.advertisement_campaigns TO anon, authenticated;
GRANT ALL ON public.advertisement_campaigns TO service_role;
GRANT INSERT ON public.ad_impressions TO anon, authenticated;
GRANT SELECT ON public.ad_impressions TO authenticated;
GRANT ALL ON public.ad_impressions TO service_role;

COMMENT ON TABLE public.advertisement_campaigns IS 'Enhanced advertisement campaigns for marketplace sidebar, interstitial, and banner placements';
COMMENT ON TABLE public.ad_impressions IS 'Tracks ad impressions and clicks for analytics';
