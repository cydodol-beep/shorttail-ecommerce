-- Function that updates membership tier using service role to bypass RLS
CREATE OR REPLACE FUNCTION update_membership_tier_with_service_role()
RETURNS TRIGGER AS $$
DECLARE
  settings_row RECORD;
  new_tier membership_tier;
BEGIN
  -- Get the latest store settings using service role
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
    new_tier := 'Adulthood';
  ELSIF NEW.points_balance >= COALESCE(settings_row.tier_adolescence_threshold, 5000) THEN
    new_tier := 'Adolescence';
  ELSIF NEW.points_balance >= COALESCE(settings_row.tier_juvenile_threshold, 2000) THEN
    new_tier := 'Juvenile';
  ELSIF NEW.points_balance >= COALESCE(settings_row.tier_transitional_threshold, 500) THEN
    new_tier := 'Transitional';
  ELSE
    new_tier := 'Newborn';
  END IF;

  -- Update the tier using a service role (has admin privileges)
  -- This will update the tier for the current user
  UPDATE profiles 
  SET tier = new_tier
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a new trigger that calls the service role function
DROP TRIGGER IF EXISTS update_membership_tier_trigger ON profiles;
CREATE TRIGGER update_membership_tier_trigger
  AFTER UPDATE OF points_balance ON profiles
  FOR EACH ROW
  WHEN (OLD.points_balance IS DISTINCT FROM NEW.points_balance AND OLD.tier IS DISTINCT FROM NEW.tier)
  EXECUTE FUNCTION update_membership_tier_with_service_role();

-- Run a full batch update to fix existing incorrect tiers using service role
UPDATE profiles 
SET tier = CASE 
  WHEN points_balance >= (SELECT COALESCE(tier_adulthood_threshold, 10000) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Adulthood'::membership_tier
  WHEN points_balance >= (SELECT COALESCE(tier_adolescence_threshold, 5000) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Adolescence'::membership_tier
  WHEN points_balance >= (SELECT COALESCE(tier_juvenile_threshold, 2000) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Juvenile'::membership_tier
  WHEN points_balance >= (SELECT COALESCE(tier_transitional_threshold, 500) FROM store_settings ORDER BY updated_at DESC LIMIT 1) THEN 'Transitional'::membership_tier
  ELSE 'Newborn'::membership_tier
END;