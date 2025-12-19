-- Function to properly update membership tier based on points with stored settings
CREATE OR REPLACE FUNCTION update_membership_tier_fixed()
RETURNS TRIGGER AS $$
DECLARE
  settings_row RECORD;
BEGIN
  -- Get the latest store settings
  SELECT 
    tier_newborn_threshold,
    tier_transitional_threshold, 
    tier_juvenile_threshold,
    tier_adolescence_threshold,
    tier_adulthood_threshold
  INTO settings_row
  FROM store_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Determine the new tier based on points and store settings
  IF NEW.points_balance >= COALESCE(settings_row.tier_adulthood_threshold, 10000) THEN
    NEW.tier := 'Adulthood';
  ELSIF NEW.points_balance >= COALESCE(settings_row.tier_adolescence_threshold, 5000) THEN
    NEW.tier := 'Adolescence';
  ELSIF NEW.points_balance >= COALESCE(settings_row.tier_juvenile_threshold, 2000) THEN
    NEW.tier := 'Juvenile';
  ELSIF NEW.points_balance >= COALESCE(settings_row.tier_transitional_threshold, 500) THEN
    NEW.tier := 'Transitional';
  ELSE
    NEW.tier := 'Newborn';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the existing trigger with the fixed function
DROP TRIGGER IF EXISTS update_membership_tier_trigger ON profiles;

CREATE TRIGGER update_membership_tier_trigger
  BEFORE UPDATE OF points_balance ON profiles
  FOR EACH ROW
  WHEN (OLD.points_balance IS DISTINCT FROM NEW.points_balance)
  EXECUTE FUNCTION update_membership_tier_fixed();

-- Also run a full batch update to fix existing incorrect tiers
-- Create temporary function for single execution of the bulk update
DO $$
DECLARE
  settings_row RECORD;
  user_record RECORD;
BEGIN
  -- Get current store settings
  SELECT 
    tier_newborn_threshold,
    tier_transitional_threshold, 
    tier_juvenile_threshold,
    tier_adolescence_threshold,
    tier_adulthood_threshold
  INTO settings_row
  FROM store_settings
  ORDER BY updated_at DESC
  LIMIT 1;

  -- Loop through all users and update their tiers based on current points
  FOR user_record IN SELECT id, points_balance FROM profiles LOOP
    IF user_record.points_balance >= COALESCE(settings_row.tier_adulthood_threshold, 10000) THEN
      UPDATE profiles SET tier = 'Adulthood' WHERE id = user_record.id;
    ELSIF user_record.points_balance >= COALESCE(settings_row.tier_adolescence_threshold, 5000) THEN
      UPDATE profiles SET tier = 'Adolescence' WHERE id = user_record.id;
    ELSIF user_record.points_balance >= COALESCE(settings_row.tier_juvenile_threshold, 2000) THEN
      UPDATE profiles SET tier = 'Juvenile' WHERE id = user_record.id;
    ELSIF user_record.points_balance >= COALESCE(settings_row.tier_transitional_threshold, 500) THEN
      UPDATE profiles SET tier = 'Transitional' WHERE id = user_record.id;
    ELSE
      UPDATE profiles SET tier = 'Newborn' WHERE id = user_record.id;
    END IF;
  END LOOP;
END $$;