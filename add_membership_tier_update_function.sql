-- Function to update membership tier based on points
CREATE OR REPLACE FUNCTION update_membership_tier()
RETURNS TRIGGER AS $$
DECLARE
  store_settings RECORD;
  new_tier TEXT;
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

  -- Determine new tier based on points and store settings
  IF NEW.points_balance >= COALESCE(store_settings.tier_adulthood_threshold, 10000) THEN
    new_tier := 'Adulthood';
  ELSIF NEW.points_balance >= COALESCE(store_settings.tier_adolescence_threshold, 5000) THEN
    new_tier := 'Adolescence';
  ELSIF NEW.points_balance >= COALESCE(store_settings.tier_juvenile_threshold, 2000) THEN
    new_tier := 'Juvenile';
  ELSIF NEW.points_balance >= COALESCE(store_settings.tier_transitional_threshold, 500) THEN
    new_tier := 'Transitional';
  ELSE
    new_tier := 'Newborn';
  END IF;

  -- Only update if the tier actually changed
  IF NEW.tier != new_tier::membership_tier THEN
    NEW.tier := new_tier::membership_tier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update membership tier when points are changed
CREATE TRIGGER update_membership_tier_trigger
  BEFORE UPDATE OF points_balance ON profiles
  FOR EACH ROW
  WHEN (OLD.points_balance IS DISTINCT FROM NEW.points_balance)
  EXECUTE FUNCTION update_membership_tier();