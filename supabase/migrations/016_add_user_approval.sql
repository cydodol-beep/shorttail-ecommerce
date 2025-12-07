-- Add is_approved field to profiles for admin approval workflow
-- Users created by admin are auto-approved, self-registered users require approval

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

-- Set existing users as approved (they were created before this feature)
UPDATE public.profiles SET is_approved = TRUE WHERE is_approved IS NULL OR is_approved = FALSE;

-- Update handle_new_user function to set is_approved = false for self-registered users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_email, user_phoneno, user_name, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'phone', new.email),
    new.raw_user_meta_data->>'full_name',
    'normal_user',
    FALSE -- New self-registered users need admin approval
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
