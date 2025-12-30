-- Add triggers to automatically create notifications for various system events

-- Trigger for new user registration (notification for admins)
CREATE OR REPLACE FUNCTION notify_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for admins when a new user registers
  INSERT INTO public.notifications (
    user_id, -- NULL means broadcast to all admins
    title,
    message,
    action_link
  )
  VALUES (
    NULL,
    'New User Registered!',
    'A new user "' || COALESCE(NEW.user_name, NEW.user_phoneno, 'Unknown') || '" has registered. Please approve their account.',
    '/admin/users'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles table for new user registration
DROP TRIGGER IF EXISTS on_new_user_notify ON public.profiles;
CREATE TRIGGER on_new_user_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  WHEN (NEW.is_approved = FALSE) -- Only trigger for unapproved users (need admin approval)
  EXECUTE FUNCTION notify_new_user();

-- Trigger for new orders that creates notifications
CREATE OR REPLACE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Get the user's name if it's a marketplace order
  SELECT user_name INTO user_name 
  FROM public.profiles 
  WHERE id = NEW.user_id;

  -- Create notification for admins when a new order is placed
  INSERT INTO public.notifications (
    user_id, -- NULL means broadcast to all admins
    title,
    message,
    action_link
  )
  VALUES (
    NULL,
    CASE 
      WHEN NEW.source = 'pos' THEN 'New POS Order!'
      ELSE 'New Marketplace Order!'
    END,
    CASE 
      WHEN NEW.source = 'pos' THEN 'POS Order #' || COALESCE(NEW.custom_order_id, NEW.id::text) || ' placed with total: ' || NEW.total_amount::text
      ELSE 'Marketplace Order #' || COALESCE(NEW.custom_order_id, NEW.id::text) || ' placed by ' || COALESCE(user_name, 'User') || ' with total: ' || NEW.total_amount::text
    END,
    '/admin/orders'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to orders table for new orders
DROP TRIGGER IF EXISTS on_new_order_notify ON public.orders;
CREATE TRIGGER on_new_order_notify
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_order();

-- Trigger for new reviews that creates notifications
CREATE OR REPLACE FUNCTION notify_new_review()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
BEGIN
  -- Get the product name
  SELECT name INTO product_name 
  FROM public.products 
  WHERE id = NEW.product_id;

  -- Create notification for admins when a new review is received (only for pending reviews)
  INSERT INTO public.notifications (
    user_id, -- NULL means broadcast to all admins
    title,
    message,
    action_link
  )
  VALUES (
    NULL,
    'New Review Pending Approval!',
    'A new review has been submitted for "' || COALESCE(product_name, 'Product') || '" by ' || 
    (SELECT COALESCE(user_name, 'a customer') FROM public.profiles WHERE id = NEW.user_id) || '. Please review and approve.',
    '/admin/reviews'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to reviews table for new reviews that need approval
-- Only create notifications for pending reviews (is_approved = false)
CREATE OR REPLACE FUNCTION notify_pending_review()
RETURNS TRIGGER AS $$
DECLARE
  product_name TEXT;
BEGIN
  -- Only notify if the review is not approved (pending status)
  IF NEW.is_approved = false THEN
    -- Get the product name
    SELECT name INTO product_name 
    FROM public.products 
    WHERE id = NEW.product_id;

    -- Create notification for admins when a new pending review is received
    INSERT INTO public.notifications (
      user_id, -- NULL means broadcast to all admins
      title,
      message,
      action_link
    )
    VALUES (
      NULL,
      'New Review Pending Approval!',
      'A new review has been submitted for "' || COALESCE(product_name, 'Product') || '" by ' || 
      (SELECT COALESCE(user_name, 'a customer') FROM public.profiles WHERE id = NEW.user_id) || '. Please review and approve.',
      '/admin/reviews'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to reviews table for new pending reviews
DROP TRIGGER IF EXISTS on_new_pending_review_notify ON public.reviews;
CREATE TRIGGER on_new_pending_review_notify
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_pending_review();

-- Update the trigger to handle updates too (in case a review gets unapproved)
DROP TRIGGER IF EXISTS on_review_update_notify ON public.reviews;
CREATE TRIGGER on_review_update_notify
  AFTER UPDATE ON public.reviews
  FOR EACH ROW
  WHEN (OLD.is_approved = true AND NEW.is_approved = false) -- Changed from approved to unapproved
  EXECUTE FUNCTION notify_pending_review();