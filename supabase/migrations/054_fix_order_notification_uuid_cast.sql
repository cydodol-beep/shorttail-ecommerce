-- Fix: Cast UUID to TEXT before using SUBSTRING function
-- This fixes the error "function substring(uuid, integer, integer) does not exist"

-- Drop ALL existing order-related notification triggers first to prevent conflicts
DROP TRIGGER IF EXISTS notify_staff_on_order_create ON public.orders;
DROP TRIGGER IF EXISTS notify_staff_on_order_update ON public.orders;
DROP TRIGGER IF EXISTS on_new_order_notify ON public.orders;

-- Drop the old functions that might have UUID issues
DROP FUNCTION IF EXISTS notify_staff_of_order_change() CASCADE;

-- Recreate function with proper UUID to TEXT casting
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
    -- Fix: Cast UUID to TEXT before using SUBSTRING
    notification_message := 'New order #' || COALESCE(NEW.custom_order_id, SUBSTRING(NEW.id::TEXT, 1, 8)) || ' placed by ' || COALESCE((SELECT user_name FROM profiles WHERE id = NEW.user_id), 'Customer') || ' with total amount of ' || NEW.total_amount::TEXT;
    action_path := '/admin/orders/' || NEW.id::TEXT;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Order status updated
    IF OLD.status != NEW.status THEN
      notification_title := 'Order Status Updated';
      -- Fix: Cast UUID to TEXT before using SUBSTRING
      notification_message := 'Order #' || COALESCE(NEW.custom_order_id, SUBSTRING(NEW.id::TEXT, 1, 8)) || ' status changed from ' || OLD.status || ' to ' || NEW.status || ' with total amount of ' || NEW.total_amount::TEXT;
      action_path := '/admin/orders/' || NEW.id::TEXT;
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

-- Recreate triggers (only one set of triggers)
CREATE TRIGGER notify_staff_on_order_create
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_staff_of_order_change();

CREATE TRIGGER notify_staff_on_order_update
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_staff_of_order_change();
