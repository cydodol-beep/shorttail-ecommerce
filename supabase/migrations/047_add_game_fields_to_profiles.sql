-- Add game fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS unlocked_breeds TEXT[] DEFAULT ARRAY['golden_retriever'];

-- Update RLS policy to allow users to update their game fields                        
 CREATE POLICY "Users can update own game fields" ON public.profiles                   
  FOR UPDATE USING (auth.uid() = id); 