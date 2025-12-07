-- Add recipient phone number field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS recipient_phoneno TEXT;
