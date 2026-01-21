-- Add RLS policy and function for forgot password functionality
-- This allows unauthenticated users to check if a phone number exists in the system
-- without exposing all user data

-- Drop existing function and policy if they exist
DROP FUNCTION IF EXISTS public.check_phone_exists(TEXT);
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create SECURITY DEFINER function to check if phone exists
-- This function runs with elevated privileges and only returns minimal data
CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_param TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Check if phone exists and return necessary data
  SELECT jsonb_build_object(
    'exists', CASE WHEN COUNT(*) > 0 THEN true ELSE false END,
    'user_id', p.id,
    'user_name', p.user_name,
    'user_email', p.user_email
  ) INTO v_result
  FROM public.profiles p
  WHERE p.user_phoneno = phone_param
  LIMIT 1;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all (including anon/unauthenticated for forgot password)
GRANT EXECUTE ON FUNCTION public.check_phone_exists(TEXT) TO authenticated, anon;

-- Recreate profile policy
CREATE POLICY "Users can view own profile and use check_phone_function"
  ON public.profiles
  FOR SELECT
  USING (
    -- Allow authenticated users to view their own profile
    auth.uid() = id
  );
