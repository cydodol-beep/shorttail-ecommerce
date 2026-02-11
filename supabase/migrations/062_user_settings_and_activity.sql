-- Create user_settings table for profile management and preferences
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Profile settings
    display_name VARCHAR(100),
    bio TEXT,
    location VARCHAR(100),
    website VARCHAR(200),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone_public BOOLEAN NOT NULL DEFAULT false,
    email_public BOOLEAN NOT NULL DEFAULT false,
    
    -- Privacy settings
    profile_visibility VARCHAR(20) NOT NULL DEFAULT 'public', -- 'public', 'friends', 'private'
    show_activity_status BOOLEAN NOT NULL DEFAULT true,
    show_achievements BOOLEAN NOT NULL DEFAULT true,
    allow_friend_requests BOOLEAN NOT NULL DEFAULT true,
    allow_messages BOOLEAN NOT NULL DEFAULT true,
    data_sharing BOOLEAN NOT NULL DEFAULT false,
    
    -- Theme settings
    theme VARCHAR(20) NOT NULL DEFAULT 'system', -- 'light', 'dark', 'system'
    color_scheme VARCHAR(50) NOT NULL DEFAULT 'default',
    font_size VARCHAR(10) NOT NULL DEFAULT 'medium', -- 'small', 'medium', 'large'
    reduced_motion BOOLEAN NOT NULL DEFAULT false,
    high_contrast BOOLEAN NOT NULL DEFAULT false,
    
    -- Language and localization
    language VARCHAR(10) NOT NULL DEFAULT 'id',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Jakarta',
    currency VARCHAR(10) NOT NULL DEFAULT 'IDR',
    
    -- Security settings
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    two_factor_method VARCHAR(20), -- 'authenticator', 'sms', 'email'
    login_notifications BOOLEAN NOT NULL DEFAULT true,
    suspicious_activity_alerts BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create activity_logs table for timeline
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'order', 'review', 'achievement', 'points', 'social', etc.
    title VARCHAR(200) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    points_earned INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_sessions table for tracking active sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL,
    device_name VARCHAR(100),
    device_type VARCHAR(20), -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),
    os VARCHAR(100),
    ip_address INET,
    location VARCHAR(100),
    is_current BOOLEAN NOT NULL DEFAULT false,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings"
    ON user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON user_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own activity logs"
    ON activity_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs"
    ON activity_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can delete old activity logs"
    ON activity_logs FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
    ON user_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
    ON user_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Function to initialize user settings for new users
CREATE OR REPLACE FUNCTION initialize_user_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (
        user_id,
        display_name,
        theme,
        language,
        timezone,
        currency,
        profile_visibility,
        show_activity_status,
        show_achievements,
        allow_friend_requests,
        allow_messages
    ) VALUES (
        NEW.id,
        COALESCE(NEW.full_name, split_part(NEW.email, '@', 1)),
        'system',
        'id',
        'Asia/Jakarta',
        'IDR',
        'public',
        true,
        true,
        true,
        true
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings for new users
CREATE TRIGGER trigger_init_user_settings
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_settings();

-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR,
    p_title VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_points INTEGER DEFAULT 0,
    p_xp INTEGER DEFAULT 0,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO activity_logs (
        user_id,
        activity_type,
        title,
        description,
        points_earned,
        xp_earned,
        metadata
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_title,
        p_description,
        p_points,
        p_xp,
        p_metadata
    )
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recent activity with pagination
CREATE OR REPLACE FUNCTION get_user_activity(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    activity_type VARCHAR,
    title VARCHAR,
    description TEXT,
    points_earned INTEGER,
    xp_earned INTEGER,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.activity_type,
        al.title,
        al.description,
        al.points_earned,
        al.xp_earned,
        al.metadata,
        al.created_at
    FROM activity_logs al
    WHERE al.user_id = p_user_id
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;

-- Initialize settings for existing users
INSERT INTO user_settings (
    user_id,
    display_name,
    theme,
    language,
    timezone,
    currency
)
SELECT 
    id,
    COALESCE(full_name, split_part(email, '@', 1)),
    'system',
    'id',
    'Asia/Jakarta',
    'IDR'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_settings);
