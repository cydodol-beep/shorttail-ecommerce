-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'system', -- 'system', 'promotional', 'social', 'order', 'achievement'
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    image_url VARCHAR(500),
    sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email_notifications BOOLEAN NOT NULL DEFAULT true,
    push_notifications BOOLEAN NOT NULL DEFAULT true,
    in_app_notifications BOOLEAN NOT NULL DEFAULT true,
    -- Category preferences
    system_notifications BOOLEAN NOT NULL DEFAULT true,
    promotional_notifications BOOLEAN NOT NULL DEFAULT true,
    social_notifications BOOLEAN NOT NULL DEFAULT true,
    order_notifications BOOLEAN NOT NULL DEFAULT true,
    achievement_notifications BOOLEAN NOT NULL DEFAULT true,
    -- Email digest settings
    email_digest_frequency VARCHAR(20) NOT NULL DEFAULT 'immediate', -- 'immediate', 'daily', 'weekly', 'never'
    last_digest_sent_at TIMESTAMPTZ,
    -- Quiet hours
    quiet_hours_enabled BOOLEAN NOT NULL DEFAULT false,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create push subscriptions table for web push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh VARCHAR(255) NOT NULL,
    auth VARCHAR(255) NOT NULL,
    user_agent TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions"
    ON push_subscriptions FOR ALL
    USING (auth.uid() = user_id);

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR,
    p_message TEXT,
    p_category VARCHAR DEFAULT 'system',
    p_type VARCHAR DEFAULT 'info',
    p_action_url VARCHAR DEFAULT NULL,
    p_action_label VARCHAR DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
    v_preferences RECORD;
BEGIN
    -- Check user preferences
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
    
    -- Skip if preferences don't allow this category
    IF v_preferences IS NOT NULL THEN
        IF NOT v_preferences.in_app_notifications THEN
            RETURN NULL;
        END IF;
        
        CASE p_category
            WHEN 'promotional' AND NOT v_preferences.promotional_notifications THEN RETURN NULL;
            WHEN 'social' AND NOT v_preferences.social_notifications THEN RETURN NULL;
            WHEN 'order' AND NOT v_preferences.order_notifications THEN RETURN NULL;
            WHEN 'achievement' AND NOT v_preferences.achievement_notifications THEN RETURN NULL;
            WHEN 'system' AND NOT v_preferences.system_notifications THEN RETURN NULL;
        END CASE;
        
        -- Check quiet hours
        IF v_preferences.quiet_hours_enabled THEN
            IF CURRENT_TIME BETWEEN v_preferences.quiet_hours_start AND v_preferences.quiet_hours_end THEN
                RETURN NULL;
            END IF;
        END IF;
    END IF;
    
    -- Create notification
    INSERT INTO notifications (
        user_id, title, message, category, type,
        action_url, action_label, metadata
    ) VALUES (
        p_user_id, p_title, p_message, p_category, p_type,
        p_action_url, p_action_label, p_metadata
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE id = p_notification_id
    AND user_id = p_user_id
    AND is_read = false;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications
    SET is_read = true, read_at = NOW()
    WHERE user_id = p_user_id
    AND is_read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notifications
        WHERE user_id = p_user_id
        AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to initialize default notification preferences for new users
CREATE OR REPLACE FUNCTION initialize_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (
        user_id,
        email_notifications,
        push_notifications,
        in_app_notifications,
        system_notifications,
        promotional_notifications,
        social_notifications,
        order_notifications,
        achievement_notifications,
        email_digest_frequency
    ) VALUES (
        NEW.id,
        true, true, true,
        true, true, true, true, true,
        'immediate'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default preferences for new users
CREATE TRIGGER trigger_init_notification_preferences
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_notification_preferences();

-- Initialize preferences for existing users
INSERT INTO notification_preferences (
    user_id,
    email_notifications,
    push_notifications,
    in_app_notifications,
    system_notifications,
    promotional_notifications,
    social_notifications,
    order_notifications,
    achievement_notifications,
    email_digest_frequency
)
SELECT 
    id,
    true, true, true,
    true, true, true, true, true,
    'immediate'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_preferences);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create function to handle real-time notification broadcasting
CREATE OR REPLACE FUNCTION broadcast_notification()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'new_notification',
        json_build_object(
            'user_id', NEW.user_id,
            'notification_id', NEW.id,
            'title', NEW.title,
            'category', NEW.category
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for real-time broadcasts
CREATE TRIGGER trigger_broadcast_notification
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION broadcast_notification();
