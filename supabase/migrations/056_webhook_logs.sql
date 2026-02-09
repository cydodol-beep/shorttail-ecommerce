/**
 * Migration: Webhook Logs Table
 * 
 * This migration creates a table for logging webhook events,
 * providing an audit trail for order status changes and email notifications.
 */

-- ============================================================================
-- 1. Create webhook_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'order_status_change', 'payment_received', etc.
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    email_sent BOOLEAN DEFAULT false,
    email_results TEXT[], -- Array of email result statuses
    triggered_by VARCHAR(50), -- 'payment_gateway', 'admin', 'system', 'database_trigger'
    payload JSONB, -- Original webhook payload for debugging
    response_status INTEGER, -- HTTP response status
    error_message TEXT,
    processed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS Policies
-- ============================================================================

-- Only admins can view webhook logs
CREATE POLICY "Only admins can view webhook logs"
    ON webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master_admin', 'normal_admin', 'super_user')
        )
    );

-- Only system can insert webhook logs
CREATE POLICY "Only system can insert webhook logs"
    ON webhook_logs FOR INSERT
    WITH CHECK (true); -- Allow inserts from backend/API

-- No updates or deletes allowed
CREATE POLICY "No updates to webhook logs"
    ON webhook_logs FOR UPDATE
    USING (false);

CREATE POLICY "No deletes from webhook logs"
    ON webhook_logs FOR DELETE
    USING (false);

-- ============================================================================
-- 3. Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_webhook_logs_order_id 
    ON webhook_logs(order_id);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_type 
    ON webhook_logs(event_type);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at 
    ON webhook_logs(processed_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at 
    ON webhook_logs(created_at DESC);

-- ============================================================================
-- 4. Function to call webhook on order status change
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_order_status_webhook()
RETURNS TRIGGER AS $$
DECLARE
    webhook_url TEXT;
    webhook_secret TEXT;
    payload JSONB;
BEGIN
    -- Only trigger if status actually changed
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Get webhook configuration from environment or settings
    -- In production, this should be configured via environment variables
    webhook_url := COALESCE(
        current_setting('app.webhook_url', true),
        'https://shorttail.id/api/webhooks/order-status'
    );
    
    webhook_secret := COALESCE(
        current_setting('app.webhook_secret', true),
        ''
    );

    -- Build payload
    payload := jsonb_build_object(
        'orderId', NEW.id,
        'oldStatus', OLD.status,
        'newStatus', NEW.status,
        'triggeredBy', 'database_trigger',
        'metadata', jsonb_build_object(
            'changed_at', NOW(),
            'user_id', NEW.user_id
        )
    );

    -- Log the webhook trigger attempt
    INSERT INTO webhook_logs (
        order_id,
        event_type,
        old_status,
        new_status,
        triggered_by,
        payload,
        processed_at
    ) VALUES (
        NEW.id,
        'order_status_change',
        OLD.status,
        NEW.status,
        'database_trigger',
        payload,
        NOW()
    );

    -- Note: Actual HTTP call should be handled by pg_http extension
    -- or an external service like Supabase Edge Functions
    -- Example with pg_http (if enabled):
    -- PERFORM http_post(
    --     webhook_url,
    --     'application/json',
    --     payload::text,
    --     ARRAY[http_header('x-webhook-secret', webhook_secret)]
    -- );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Create or replace the trigger
-- ============================================================================

DROP TRIGGER IF EXISTS order_status_webhook_trigger ON orders;

CREATE TRIGGER order_status_webhook_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_order_status_webhook();

-- ============================================================================
-- 6. Cleanup function for old webhook logs
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM webhook_logs
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT ON webhook_logs TO authenticated;
-- Note: No sequence grant needed as id uses gen_random_uuid() (UUID), not SERIAL

-- ============================================================================
-- Migration Complete
-- ============================================================================

COMMENT ON TABLE webhook_logs IS 'Audit log for webhook events including order status changes and email notifications';
COMMENT ON FUNCTION trigger_order_status_webhook() IS 'Database trigger function to call webhook when order status changes';