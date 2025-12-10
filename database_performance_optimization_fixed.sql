-- Database Performance Optimization for ShortTail.id
-- This SQL script optimizes the profiles table and related queries to fix timeout issues
-- Run this in your Supabase SQL Editor

-- 1. Add Indexes for Faster Profile Lookups
-- Primary index for id lookups (should already exist but ensure it does)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- Index for role-based queries (critical for auth flow)  
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index for user metadata lookups
CREATE INDEX IF NOT EXISTS idx_profiles_user_metadata ON profiles(user_phoneno, user_email);

-- 2. Create a lighter view for auth operations only
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

-- 3. Create materialized view for even faster access (optional)
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

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW profile_cache;

-- 4. Optimize the auth function that's used in middleware
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

-- Safe function for getting user role
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_for_auth TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_role_safe TO authenticated, anon;

-- 5. Consider adding a composite index if you frequently filter by multiple columns
CREATE INDEX IF NOT EXISTS idx_profiles_composite ON profiles(id, role, is_approved) WHERE is_active = true;

-- 6. Analyze tables for query optimizer statistics
ANALYZE profiles;

-- Instructions for use:
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
   REFRESH MATERIALIZED VIEW profile_cache;
*/