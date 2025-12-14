-- Update existing orders to populate user_name from profiles table
-- Only for orders that have a user_id (not POS walk-in orders)
UPDATE public.orders 
SET user_name = p.user_name
FROM public.profiles p
WHERE public.orders.user_id = p.id 
AND public.orders.user_name IS NULL;