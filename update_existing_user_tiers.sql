-- Function to update all user membership tiers based on current points
CREATE OR REPLACE FUNCTION update_all_user_tiers()
RETURNS void AS $$
DECLARE
  store_settings RECORD;
  user_record RECORD;
BEGIN
  -- Get current store settings for tier thresholds
  SELECT 
    tier_newborn_threshold,
    tier_transitional_threshold, 
    tier_juvenile_threshold,
    tier_adolescence_threshold,
    tier_adulthood_threshold
  INTO store_settings
  FROM store_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Loop through all users and update their tiers
  FOR user_record IN
    SELECT id, points_balance FROM profiles
  LOOP
    -- Update tier based on points and store settings
    IF user_record.points_balance >= COALESCE(store_settings.tier_adulthood_threshold, 10000) THEN
      UPDATE profiles
      SET tier = 'Adulthood'::membership_tier
      WHERE id = user_record.id;
    ELSIF user_record.points_balance >= COALESCE(store_settings.tier_adolescence_threshold, 5000) THEN
      UPDATE profiles
      SET tier = 'Adolescence'::membership_tier
      WHERE id = user_record.id;
    ELSIF user_record.points_balance >= COALESCE(store_settings.tier_juvenile_threshold, 2000) THEN
      UPDATE profiles
      SET tier = 'Juvenile'::membership_tier
      WHERE id = user_record.id;
    ELSIF user_record.points_balance >= COALESCE(store_settings.tier_transitional_threshold, 500) THEN
      UPDATE profiles
      SET tier = 'Transitional'::membership_tier
      WHERE id = user_record.id;
    ELSE
      UPDATE profiles
      SET tier = 'Newborn'::membership_tier
      WHERE id = user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update all existing user tiers
SELECT update_all_user_tiers();

-- Drop the function after running it
DROP FUNCTION update_all_user_tiers();