-- Database Performance Optimization for ShortTail.id
-- This SQL script optimizes the profiles table and related queries to fix timeout issues
-- Run this in your Supabase SQL Editor

-- 1. Add Indexes for Faster Profile Lookups
-- Primary index for id lookups (should already exist but ensure it does)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Index for role-based queries (critical for auth flow)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index for user metadata lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_user_metadata ON profiles(user_phoneno, user_email);

-- 2. Optimize RLS Policies (this is often the main performance bottleneck)
-- First, let's create a more efficient RLS policy for profile access

-- Drop and recreate the RLS policy for profiles to be more efficient
-- Create a function to check role efficiently
CREATE OR REPLACE FUNCTION is_admin_or_self_check(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    -- Check if current user is the profile owner
    auth.uid() = user_id
    OR
    -- Check if current user is an admin
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('master_admin', 'normal_admin', 'super_user')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the optimized policy
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
  );

DROP POLICY IF EXISTS "Staff can view all profiles" ON profiles;
CREATE POLICY "Staff can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p2
      WHERE p2.id = auth.uid()
      AND p2.role IN ('master_admin', 'normal_admin', 'super_user')
    )
  );

-- 3. Create a lighter view for auth operations only
CREATE OR REPLACE VIEW public.profile_light AS
SELECT 
    id,
    user_name,
    user_phoneno,
    user_email,
    role,
    tier,
    points_balance,
    is_approved,
    created_at,
    updated_at
FROM profiles
WHERE is_active = true;

-- Grant permissions
GRANT SELECT ON profile_light TO authenticated, anon;

-- 4. Create materialized view for even faster access (optional)
-- This is for frequently accessed profile data
CREATE MATERIALIZED VIEW IF NOT EXISTS public.profile_cache AS
SELECT 
    id,
    user_name,
    user_phoneno,
    role,
    tier,
    points_balance,
    is_approved
FROM profiles
WHERE is_active = true;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_profile_cache_id ON profile_cache(id);
CREATE INDEX IF NOT EXISTS idx_profile_cache_role ON profile_cache(role);

-- Grant permissions
GRANT SELECT ON profile_cache TO authenticated, anon;

-- Refresh the materialized view periodically (you can set up a cron job for this)
REFRESH MATERIALIZED VIEW CONCURRENTLY profile_cache;

-- 5. Additional performance improvements
-- Increase work_mem for better sorting performance (if allowed in your plan)
-- Note: This may not be available in all Supabase plans
-- SET work_mem = '64MB';

-- 6. Analyze tables for query optimizer statistics
ANALYZE profiles;

-- 7. If you still have RLS-related performance issues, consider a specific optimized function
-- for the auth middleware profile fetch
CREATE OR REPLACE FUNCTION get_user_role_safe(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Direct query without complex joins for better performance
    SELECT role INTO user_role
    FROM profiles
    WHERE id = p_user_id
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'normal_user');
EXCEPTION
    WHEN OTHERS THEN
        -- Return safe default in case of any errors
        RETURN 'normal_user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Optimize the auth function that's used in middleware
-- This function can be called by the middleware instead of a complex query
CREATE OR REPLACE FUNCTION get_profile_for_auth(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    role TEXT,
    is_approved BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.role,
        p.is_approved
    FROM profiles p
    WHERE p.id = p_user_id
    AND p.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_for_auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_role_safe TO authenticated, anon;

-- 9. Consider adding a composite index if you frequently filter by multiple columns
-- This is especially useful if the auth middleware queries multiple profile fields
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_composite ON profiles(id, role, is_approved) WHERE is_active = true;

-- 10. Instructions for use:
/*
After running this script:

1. The middleware can use the get_profile_for_auth function:
   SELECT * FROM get_profile_for_auth(user_id)

2. The auth hook can use the get_user_role_safe function:
   SELECT get_user_role_safe(user_id)

3. The materialized view can be used for faster profile queries:
   SELECT * FROM profile_cache WHERE id = user_id

4. The profile_light view can be used for general profile queries:
   SELECT * FROM profile_light WHERE id = user_id

5. The new indexes should improve all profile queries

6. Remember to refresh the materialized view periodically:
   REFRESH MATERIALIZED VIEW CONCURRENTLY profile_cache;
*/