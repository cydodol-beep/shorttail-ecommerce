/**
 * Migration: Real-time Notifications with Supabase Realtime
 * 
 * This migration extends the existing notifications system to support
 * real-time broadcasts via Supabase Realtime. It includes:
 * - notifications_broadcast table for real-time events
 * - Database triggers to auto-broadcast on order status changes
 * - RLS policies for secure access
 * - Indexes for performance
 */

-- ============================================================================
-- 1. Create notifications_broadcast table for real-time events
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications_broadcast (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'order_update', 'new_order', 'promotion', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_broadcast BOOLEAN DEFAULT false, -- If true, sent to all users of a role
    target_role VARCHAR(50), -- 'kasir', 'admin', 'user' - for broadcast notifications
    is_read BOOLEAN DEFAULT false,
    action_link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE notifications_broadcast ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS Policies for notifications_broadcast
-- ============================================================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own and broadcast notifications" ON notifications_broadcast;
DROP POLICY IF EXISTS "Only admins can create notifications" ON notifications_broadcast;
DROP POLICY IF EXISTS "Users can update their own notification read status" ON notifications_broadcast;
DROP POLICY IF EXISTS "Only admins can delete notifications" ON notifications_broadcast;

-- Users can see their own notifications OR broadcast notifications targeted at their role
CREATE POLICY "Users can view their own and broadcast notifications"
    ON notifications_broadcast FOR SELECT
    USING (
        user_id = auth.uid() 
        OR (
            is_broadcast = true 
            AND target_role = (
                SELECT role::text FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Only admins can create notifications
CREATE POLICY "Only admins can create notifications"
    ON notifications_broadcast FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master_admin'::app_role, 'normal_admin'::app_role, 'super_user'::app_role)
        )
    );

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notification read status"
    ON notifications_broadcast FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Only admins can delete notifications
CREATE POLICY "Only admins can delete notifications"
    ON notifications_broadcast FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('master_admin'::app_role, 'normal_admin'::app_role, 'super_user'::app_role)
        )
    );

-- ============================================================================
-- 3. Enable Realtime for notifications_broadcast
-- ============================================================================

-- Configure realtime publication (handles already-existing gracefully)
DO $$
BEGIN
    -- Check if publication exists
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Try to add table to existing publication (will be skipped if already member)
        BEGIN
            EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE notifications_broadcast';
        EXCEPTION WHEN duplicate_object THEN
            -- Table already in publication, ignore
            NULL;
        END;
    ELSE
        -- Create new publication
        CREATE PUBLICATION supabase_realtime FOR TABLE notifications_broadcast, orders;
    END IF;
END $$;

-- ============================================================================
-- 4. Function to broadcast order status updates
-- ============================================================================

CREATE OR REPLACE FUNCTION broadcast_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_user_name VARCHAR(255);
    v_order_custom_id VARCHAR(255);
BEGIN
    -- Get user name and custom order ID
    SELECT 
        COALESCE(p.user_name, p.user_email, 'Customer'),
        o.custom_order_id
    INTO v_user_name, v_order_custom_id
    FROM orders o
    LEFT JOIN profiles p ON p.id = NEW.user_id
    WHERE o.id = NEW.id;

    -- Insert notification for the customer
    IF NEW.user_id IS NOT NULL THEN
        INSERT INTO notifications_broadcast (
            user_id,
            type,
            title,
            message,
            metadata,
            action_link
        ) VALUES (
            NEW.user_id,
            'order_update',
            'Pesanan Diperbarui',
            format('Pesanan %s status berubah menjadi %s', 
                COALESCE(v_order_custom_id, NEW.id::text), 
                NEW.status
            ),
            jsonb_build_object(
                'order_id', NEW.id,
                'custom_order_id', v_order_custom_id,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'total_amount', NEW.total_amount
            ),
            '/dashboard/orders/' || NEW.id
        );
    END IF;

    -- Broadcast to kasir users for new orders
    IF OLD.status = 'pending' AND NEW.status = 'paid' THEN
        INSERT INTO notifications_broadcast (
            type,
            title,
            message,
            metadata,
            is_broadcast,
            target_role
        ) VALUES (
            'new_order',
            'Pesanan Baru Dibayar',
            format('Pesanan dari %s sebesar Rp %s telah dibayar', 
                v_user_name, 
                TO_CHAR(NEW.total_amount, 'FM999,999,999,999')
            ),
            jsonb_build_object(
                'order_id', NEW.id,
                'custom_order_id', v_order_custom_id,
                'user_name', v_user_name,
                'total_amount', NEW.total_amount
            ),
            true,
            'kasir'
        );
    END IF;

    -- Broadcast to admins for high-value orders
    IF NEW.total_amount >= 1000000 AND OLD.status = 'pending' AND NEW.status = 'paid' THEN
        INSERT INTO notifications_broadcast (
            type,
            title,
            message,
            metadata,
            is_broadcast,
            target_role
        ) VALUES (
            'new_order',
            'Pesanan Besar Diterima',
            format('Pesanan besar dari %s sebesar Rp %s', 
                v_user_name, 
                TO_CHAR(NEW.total_amount, 'FM999,999,999,999')
            ),
            jsonb_build_object(
                'order_id', NEW.id,
                'custom_order_id', v_order_custom_id,
                'user_name', v_user_name,
                'total_amount', NEW.total_amount,
                'is_high_value', true
            ),
            true,
            'admin'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. Trigger to auto-broadcast on order status change
-- ============================================================================

DROP TRIGGER IF EXISTS order_status_broadcast_trigger ON orders;

CREATE TRIGGER order_status_broadcast_trigger
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION broadcast_order_status_change();

-- ============================================================================
-- 6. Function to mark notification as read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications_broadcast
    SET 
        is_read = true,
        read_at = NOW()
    WHERE 
        id = p_notification_id 
        AND (user_id = auth.uid() OR is_broadcast = true);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. Function to get unread notification count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_user_role VARCHAR(50);
BEGIN
    -- Get user role
    SELECT role::text INTO v_user_role FROM profiles WHERE id = COALESCE(p_user_id, auth.uid());
    
    SELECT COUNT(*) INTO v_count
    FROM notifications_broadcast
    WHERE 
        is_read = false
        AND (
            user_id = COALESCE(p_user_id, auth.uid())
            OR (
                is_broadcast = true 
                AND target_role = v_user_role
            )
        )
        AND created_at > NOW() - INTERVAL '7 days';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 8. Cleanup function for old notifications
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM notifications_broadcast
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = true;
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. Indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_user_id 
    ON notifications_broadcast(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_is_broadcast_target_role 
    ON notifications_broadcast(is_broadcast, target_role) 
    WHERE is_broadcast = true;

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_is_read_created_at 
    ON notifications_broadcast(is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_type_created_at 
    ON notifications_broadcast(type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_created_at 
    ON notifications_broadcast(created_at DESC);

-- ============================================================================
-- 10. Grant permissions
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON notifications_broadcast TO authenticated;
-- Note: No sequence grant needed as id uses gen_random_uuid() (UUID), not SERIAL

-- ============================================================================
-- 11. Add realtime configuration comment
-- ============================================================================

COMMENT ON TABLE notifications_broadcast IS 
'Real-time notification system using Supabase Realtime. 
Subscribe to changes for instant notifications.
Client subscription example:
  supabase
    .channel("notifications")
    .on("postgres_changes", 
      { event: "INSERT", schema: "public", table: "notifications_broadcast" },
      (payload) => console.log(payload)
    )
    .subscribe();';

-- ============================================================================
-- Migration Complete
-- ============================================================================