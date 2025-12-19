-- Create function to send notifications to staff when orders are created or updated
CREATE OR REPLACE FUNCTION notify_staff_of_order_change()
RETURNS TRIGGER AS $$
DECLARE
  admin_users RECORD;
  notification_title TEXT;
  notification_message TEXT;
  action_path TEXT;
BEGIN
  -- Determine message based on order status and operation
  IF TG_OP = 'INSERT' THEN
    -- New order created
    notification_title := 'New Order Placed';
    notification_message := 'New order #' || SUBSTRING(NEW.id, 1, 8) || ' placed by ' || COALESCE((SELECT user_name FROM profiles WHERE id = NEW.user_id), 'Customer') || ' with total amount of ' || NEW.total_amount::TEXT;
    action_path := '/admin/orders/' || NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Order status updated
    IF OLD.status != NEW.status THEN
      notification_title := 'Order Status Updated';
      notification_message := 'Order #' || SUBSTRING(NEW.id, 1, 8) || ' status changed from ' || OLD.status || ' to ' || NEW.status || ' with total amount of ' || NEW.total_amount::TEXT;
      action_path := '/admin/orders/' || NEW.id;
    ELSE
      -- No significant change, return early
      RETURN NEW;
    END IF;
  ELSE
    -- For other operations, just return
    RETURN NEW;
  END IF;

  -- Send notification to all staff users with roles: master_admin, normal_admin, kasir, super_user
  FOR admin_users IN
    SELECT id FROM profiles 
    WHERE role IN ('master_admin', 'normal_admin', 'kasir', 'super_user')
  LOOP
    INSERT INTO notifications (user_id, title, message, action_link, is_read)
    VALUES (admin_users.id, notification_title, notification_message, action_path, FALSE);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order insertions
CREATE TRIGGER notify_staff_on_order_create
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_staff_of_order_change();

-- Create trigger for order updates (only when status changes)
CREATE TRIGGER notify_staff_on_order_update
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_staff_of_order_change();

-- Also create trigger to update points after order status changed to 'delivered'
CREATE OR REPLACE FUNCTION update_user_points_after_delivery()
RETURNS TRIGGER AS $$
DECLARE
  user_profile RECORD;
  points_to_add INTEGER;
BEGIN
  -- Only process if order status changed to 'delivered' and was not previously 'delivered'
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.user_id IS NOT NULL THEN
    -- Calculate points to add (1 point per 10,000 IDR spent, after discount)
    points_to_add := FLOOR(NEW.total_amount / 10000)::INTEGER;

    -- Update user profile with new points
    UPDATE profiles
    SET points_balance = points_balance + points_to_add
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to orders table
CREATE TRIGGER update_user_points_on_delivery
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND OLD.status != 'delivered')
  EXECUTE FUNCTION update_user_points_after_delivery();

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