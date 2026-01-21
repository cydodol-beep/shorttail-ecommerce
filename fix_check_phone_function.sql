-- ==============================================================================
-- Fix check_phone_exists function for forgot password
-- Run this in your Supabase SQL Editor
-- ==============================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.check_phone_exists(TEXT);

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_param TEXT)
RETURNS JSONB AS $$
DECLARE
  v_profile RECORD;
  v_result JSONB;
BEGIN
  -- Find the profile first
  SELECT id, user_name, user_email
  INTO v_profile
  FROM public.profiles p
  WHERE p.user_phoneno = phone_param
  LIMIT 1;

  -- Build result based on whether profile was found
  IF FOUND THEN
    v_result := jsonb_build_object(
      'exists', true,
      'user_id', v_profile.id,
      'user_name', v_profile.user_name,
      'user_email', v_profile.user_email
    );
  ELSE
    v_result := jsonb_build_object(
      'exists', false,
      'user_id', NULL,
      'user_name', NULL,
      'user_email', NULL
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all (including anon/unauthenticated for forgot password)
GRANT EXECUTE ON FUNCTION public.check_phone_exists(TEXT) TO authenticated, anon;

-- Test the function - remove this after testing
SELECT check_phone_exists('081210630911');
SELECT check_phone_exists('6281210630911');
SELECT check_phone_exists('+6281210630911');

-- Check what formats are actually in your database
SELECT user_phoneno, user_name, user_email FROM profiles WHERE user_phoneno LIKE '%81210630911%';
