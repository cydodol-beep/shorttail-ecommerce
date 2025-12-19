-- Fix for existing user tiers that weren't properly updated
-- This is a simplified version that updates all user tiers based on their current points
UPDATE profiles 
SET tier = CASE 
  WHEN points_balance >= (SELECT COALESCE(tier_adulthood_threshold, 10000) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Adulthood'::membership_tier
  WHEN points_balance >= (SELECT COALESCE(tier_adolescence_threshold, 5000) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Adolescence'::membership_tier
  WHEN points_balance >= (SELECT COALESCE(tier_juvenile_threshold, 2000) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Juvenile'::membership_tier
  WHEN points_balance >= (SELECT COALESCE(tier_transitional_threshold, 500) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Transitional'::membership_tier
  ELSE 'Newborn'::membership_tier
END;