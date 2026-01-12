-- Create a table to track website traffic
CREATE TABLE public.traffic_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address INET NOT NULL,
  user_agent TEXT,
  page_url TEXT,
  referrer TEXT,
  user_id UUID REFERENCES public.profiles(id), -- Track logged in users
  country_code TEXT,
  city TEXT,
  latitude NUMERIC(8, 5),
  longitude NUMERIC(8, 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security: Only admins can view traffic data
ALTER TABLE public.traffic_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view traffic logs" ON public.traffic_logs
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert traffic logs" ON public.traffic_logs
  FOR INSERT WITH CHECK (public.is_admin() OR true); -- Allow inserts from API

-- Performance index on created_at for time-based queries
CREATE INDEX idx_traffic_logs_created_at ON public.traffic_logs (created_at);

-- Index for faster filtering by user_id
CREATE INDEX idx_traffic_logs_user_id ON public.traffic_logs (user_id);

-- Index for filtering by IP address (for deduplication)
CREATE INDEX idx_traffic_logs_ip_address ON public.traffic_logs (ip_address);

-- Function to get hourly traffic statistics
CREATE OR REPLACE FUNCTION get_hourly_traffic(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(
  hour TIMESTAMP,
  unique_visitors BIGINT,
  total_visits BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('hour', created_at) AS hour,
    COUNT(DISTINCT ip_address) AS unique_visitors,
    COUNT(*) AS total_visits
  FROM traffic_logs
  WHERE created_at >= start_date AND created_at <= end_date
  GROUP BY date_trunc('hour', created_at)
  ORDER BY hour;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily traffic statistics
CREATE OR REPLACE FUNCTION get_daily_traffic(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(
  day DATE,
  unique_visitors BIGINT,
  total_visits BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('day', created_at)::DATE AS day,
    COUNT(DISTINCT ip_address) AS unique_visitors,
    COUNT(*) AS total_visits
  FROM traffic_logs
  WHERE created_at >= start_date AND created_at <= end_date
  GROUP BY date_trunc('day', created_at)
  ORDER BY day;
END;
$$ LANGUAGE plpgsql;

-- Function to get monthly traffic statistics
CREATE OR REPLACE FUNCTION get_monthly_traffic(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(
  month DATE,
  unique_visitors BIGINT,
  total_visits BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_trunc('month', created_at)::DATE AS month,
    COUNT(DISTINCT ip_address) AS unique_visitors,
    COUNT(*) AS total_visits
  FROM traffic_logs
  WHERE created_at >= start_date AND created_at <= end_date
  GROUP BY date_trunc('month', created_at)
  ORDER BY month;
END;
$$ LANGUAGE plpgsql;

-- Function to get yearly traffic statistics
CREATE OR REPLACE FUNCTION get_yearly_traffic(start_date TIMESTAMPTZ, end_date TIMESTAMPTZ)
RETURNS TABLE(
  year INTEGER,
  unique_visitors BIGINT,
  total_visits BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(YEAR FROM created_at)::INTEGER AS year,
    COUNT(DISTINCT ip_address) AS unique_visitors,
    COUNT(*) AS total_visits
  FROM traffic_logs
  WHERE created_at >= start_date AND created_at <= end_date
  GROUP BY EXTRACT(YEAR FROM created_at)
  ORDER BY year;
END;
$$ LANGUAGE plpgsql;

-- Function to get traffic summary
CREATE OR REPLACE FUNCTION get_traffic_summary()
RETURNS TABLE(
  total_visitors BIGINT,
  today_visitors BIGINT,
  week_visitors BIGINT,
  month_visitors BIGINT,
  avg_daily_visitors REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Total ever
    (SELECT COUNT(DISTINCT ip_address) FROM traffic_logs) AS total_visitors,
    -- Today
    (SELECT COUNT(DISTINCT ip_address) FROM traffic_logs WHERE created_at::date = CURRENT_DATE) AS today_visitors,
    -- This week
    (SELECT COUNT(DISTINCT ip_address) FROM traffic_logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS week_visitors,
    -- This month
    (SELECT COUNT(DISTINCT ip_address) FROM traffic_logs WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS month_visitors,
    -- Average daily visitors (last 30 days)
    (SELECT COALESCE(AVG(daily_count), 0.0)::REAL 
     FROM (
       SELECT COUNT(DISTINCT ip_address) AS daily_count
       FROM traffic_logs 
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY created_at::date
     ) AS daily_stats) AS avg_daily_visitors;
END;
$$ LANGUAGE plpgsql;

-- Function to get top pages
CREATE OR REPLACE FUNCTION get_top_pages(period_days INTEGER DEFAULT 30)
RETURNS TABLE(
  page_url TEXT,
  visit_count BIGINT,
  unique_visitors BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    page_url,
    COUNT(*) AS visit_count,
    COUNT(DISTINCT ip_address) AS unique_visitors
  FROM traffic_logs
  WHERE created_at >= CURRENT_TIMESTAMP - (period_days || ' days')::INTERVAL
    AND page_url IS NOT NULL
  GROUP BY page_url
  ORDER BY visit_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to get traffic by location (country)
CREATE OR REPLACE FUNCTION get_traffic_by_country(period_days INTEGER DEFAULT 30)
RETURNS TABLE(
  country_code TEXT,
  visitor_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    country_code,
    COUNT(DISTINCT ip_address) AS visitor_count
  FROM traffic_logs
  WHERE created_at >= CURRENT_TIMESTAMP - (period_days || ' days')::INTERVAL
    AND country_code IS NOT NULL
  GROUP BY country_code
  ORDER BY visitor_count DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to get traffic by device (analyzing user agent)
CREATE OR REPLACE FUNCTION get_traffic_by_device(period_days INTEGER DEFAULT 30)
RETURNS TABLE(
  device_type TEXT,
  visitor_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN lower(user_agent) LIKE '%mobile%' OR lower(user_agent) LIKE '%android%' OR lower(user_agent) LIKE '%iphone%' THEN 'Mobile'
      WHEN lower(user_agent) LIKE '%tablet%' OR lower(user_agent) LIKE '%ipad%' THEN 'Tablet'
      ELSE 'Desktop'
    END AS device_type,
    COUNT(DISTINCT ip_address) AS visitor_count
  FROM traffic_logs
  WHERE created_at >= CURRENT_TIMESTAMP - (period_days || ' days')::INTERVAL
  GROUP BY 
    CASE 
      WHEN lower(user_agent) LIKE '%mobile%' OR lower(user_agent) LIKE '%android%' OR lower(user_agent) LIKE '%iphone%' THEN 'Mobile'
      WHEN lower(user_agent) LIKE '%tablet%' OR lower(user_agent) LIKE '%ipad%' THEN 'Tablet'
      ELSE 'Desktop'
    END
  ORDER BY visitor_count DESC;
END;
$$ LANGUAGE plpgsql;