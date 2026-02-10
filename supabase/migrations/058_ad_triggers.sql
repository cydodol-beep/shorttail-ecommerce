-- ============================================================================
-- Advertisement System Triggers and Scheduled Functions
-- ============================================================================

-- Enable pg_cron extension if available (for scheduled tasks)
-- Note: This requires pg_cron to be installed on the Supabase instance
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension not available, skipping scheduled job setup';
END $$;

-- ============================================================================
-- Function to auto-disable expired ads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_disable_expired_ads()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.advertisement_campaigns
  SET 
    status = 'expired',
    is_active = false,
    updated_at = NOW()
  WHERE 
    status = 'active'
    AND end_date IS NOT NULL
    AND end_date < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to auto-activate scheduled ads
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_activate_scheduled_ads()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.advertisement_campaigns
  SET 
    status = 'active',
    is_active = true,
    updated_at = NOW()
  WHERE 
    status IN ('paused', 'draft')
    AND is_active = false
    AND start_date IS NOT NULL
    AND start_date <= NOW()
    AND (end_date IS NULL OR end_date >= NOW());
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to update ad statistics from impressions
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_ad_stats_from_impressions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update impression count
  IF TG_OP = 'INSERT' THEN
    PERFORM public.increment_ad_impression(NEW.ad_id);
  END IF;
  
  -- Update click count if clicked
  IF TG_OP = 'UPDATE' AND NEW.clicked = true AND OLD.clicked = false THEN
    PERFORM public.increment_ad_click(NEW.ad_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_update_ad_stats ON public.ad_impressions;

-- Create trigger for impression stats
CREATE TRIGGER trg_update_ad_stats
  AFTER INSERT OR UPDATE ON public.ad_impressions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ad_stats_from_impressions();

-- ============================================================================
-- Function to clean up old impression records (data retention)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_ad_impressions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete impressions older than 90 days
  DELETE FROM public.ad_impressions
  WHERE timestamp < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Views for analytics
-- ============================================================================

-- View for ad performance summary
CREATE OR REPLACE VIEW public.ad_performance_summary AS
SELECT 
  ac.id,
  ac.title,
  ac.position,
  ac.status,
  ac.impression_count,
  ac.click_count,
  CASE 
    WHEN ac.impression_count > 0 
    THEN ROUND((ac.click_count::NUMERIC / ac.impression_count::NUMERIC) * 100, 2)
    ELSE 0 
  END AS ctr_percent,
  ac.start_date,
  ac.end_date,
  ac.created_at,
  COUNT(DISTINCT ai.session_id) AS unique_sessions,
  COUNT(DISTINCT ai.user_id) AS unique_users
FROM public.advertisement_campaigns ac
LEFT JOIN public.ad_impressions ai ON ac.id = ai.ad_id
GROUP BY ac.id, ac.title, ac.position, ac.status, ac.impression_count, ac.click_count, ac.start_date, ac.end_date, ac.created_at;

-- View for daily ad performance
CREATE OR REPLACE VIEW public.ad_daily_performance AS
SELECT 
  ai.ad_id,
  ac.title,
  ac.position,
  DATE(ai.timestamp) AS date,
  COUNT(*) AS impressions,
  COUNT(*) FILTER (WHERE ai.clicked = true) AS clicks,
  COUNT(DISTINCT ai.session_id) AS unique_sessions,
  COUNT(DISTINCT ai.user_id) AS unique_users,
  CASE 
    WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE ai.clicked = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    ELSE 0 
  END AS ctr_percent
FROM public.ad_impressions ai
JOIN public.advertisement_campaigns ac ON ai.ad_id = ac.id
GROUP BY ai.ad_id, ac.title, ac.position, DATE(ai.timestamp);

-- ============================================================================
-- Scheduled jobs (if pg_cron is available)
-- ============================================================================

DO $$
BEGIN
  -- Schedule job to auto-disable expired ads every hour
  PERFORM cron.schedule(
    'auto-disable-expired-ads',
    '0 * * * *',
    'SELECT public.auto_disable_expired_ads()'
  );
  
  -- Schedule job to auto-activate scheduled ads every 15 minutes
  PERFORM cron.schedule(
    'auto-activate-scheduled-ads',
    '*/15 * * * *',
    'SELECT public.auto_activate_scheduled_ads()'
  );
  
  -- Schedule job to clean up old impressions daily at 3 AM
  PERFORM cron.schedule(
    'cleanup-old-ad-impressions',
    '0 3 * * *',
    'SELECT public.cleanup_old_ad_impressions()'
  );
  
  RAISE NOTICE 'Scheduled jobs created successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not create scheduled jobs: %', SQLERRM;
END $$;

-- ============================================================================
-- Grant permissions on views
-- ============================================================================

GRANT SELECT ON public.ad_performance_summary TO authenticated;
GRANT SELECT ON public.ad_daily_performance TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON FUNCTION public.auto_disable_expired_ads() IS 'Automatically marks ads as expired when their end_date has passed';
COMMENT ON FUNCTION public.auto_activate_scheduled_ads() IS 'Automatically activates ads when their start_date is reached';
COMMENT ON FUNCTION public.cleanup_old_ad_impressions() IS 'Removes ad impression records older than 90 days for data retention';
COMMENT ON VIEW public.ad_performance_summary IS 'Summary view of ad performance metrics including CTR';
COMMENT ON VIEW public.ad_daily_performance IS 'Daily breakdown of ad performance metrics';
