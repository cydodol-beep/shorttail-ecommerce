-- Fix the check_phone_exists function to enhance security
-- This function now only returns whether the phone exists and the email if it does
-- It no longer returns user name or other identifying information for security

CREATE OR REPLACE FUNCTION public.check_phone_exists(phone_param TEXT)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_profile RECORD;
BEGIN
  -- Find the profile with the matching phone number
  SELECT p.id, p.user_name, p.user_email INTO v_profile
  FROM public.profiles p
  WHERE p.user_phoneno = phone_param
  LIMIT 1;

  -- Return only whether the phone exists and the email if it does
  -- Do not return user name or other identifying information for security
  IF FOUND THEN
    SELECT jsonb_build_object(
      'exists', true,
      'user_email', v_profile.user_email
    ) INTO v_result;
  ELSE
    SELECT jsonb_build_object(
      'exists', false
    ) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all (including anon/unauthenticated for forgot password)
GRANT EXECUTE ON FUNCTION public.check_phone_exists(TEXT) TO authenticated, anon;