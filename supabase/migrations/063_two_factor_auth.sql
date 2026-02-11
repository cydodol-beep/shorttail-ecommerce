-- Add 2FA columns to profiles table (if not already added via user_settings)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20), -- 'authenticator', 'sms', 'email'
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT[],
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;

-- Create two_factor_requests table for temporary 2FA verification codes
CREATE TABLE IF NOT EXISTS two_factor_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL, -- 'authenticator', 'sms', 'email'
    code_hash VARCHAR(255) NOT NULL, -- Hashed verification code
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create backup codes usage tracking
CREATE TABLE IF NOT EXISTS two_factor_backup_code_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address INET
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_two_factor_requests_user ON two_factor_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_requests_expires ON two_factor_requests(expires_at);
CREATE INDEX IF NOT EXISTS idx_backup_code_usage_user ON two_factor_backup_code_usage(user_id);

-- Enable RLS
ALTER TABLE two_factor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE two_factor_backup_code_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own 2FA requests"
    ON two_factor_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage 2FA requests"
    ON two_factor_requests FOR ALL
    USING (false)
    WITH CHECK (false);

CREATE POLICY "Users can view own backup code usage"
    ON two_factor_backup_code_usage FOR SELECT
    USING (auth.uid() = user_id);

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(p_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    v_codes TEXT[] := ARRAY[]::TEXT[];
    v_code TEXT;
    i INTEGER;
BEGIN
    -- Generate 10 backup codes
    FOR i IN 1..10 LOOP
        v_code := UPPER(SUBSTRING(MD5(random()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 8));
        v_codes := array_append(v_codes, v_code);
    END LOOP;
    
    -- Hash codes and store in profile
    UPDATE profiles
    SET two_factor_backup_codes = ARRAY(
        SELECT crypt(code, gen_salt('bf')) 
        FROM unnest(v_codes) AS code
    )
    WHERE id = p_user_id;
    
    RETURN v_codes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify backup code
CREATE OR REPLACE FUNCTION verify_backup_code(p_user_id UUID, p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_stored_hash TEXT;
BEGIN
    -- Check each stored hash
    FOREACH v_stored_hash IN ARRAY (
        SELECT two_factor_backup_codes FROM profiles WHERE id = p_user_id
    )
    LOOP
        IF crypt(p_code, v_stored_hash) = v_stored_hash THEN
            -- Mark code as used
            INSERT INTO two_factor_backup_code_usage (user_id, code_hash, ip_address)
            VALUES (p_user_id, v_stored_hash, inet_client_addr());
            
            -- Remove used code from available codes
            UPDATE profiles
            SET two_factor_backup_codes = array_remove(two_factor_backup_codes, v_stored_hash)
            WHERE id = p_user_id;
            
            RETURN true;
        END IF;
    END LOOP;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create 2FA verification request
CREATE OR REPLACE FUNCTION create_2fa_request(
    p_user_id UUID,
    p_method VARCHAR,
    p_code TEXT,
    p_expiry_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
    v_request_id UUID;
BEGIN
    -- Invalidate old requests
    UPDATE two_factor_requests
    SET verified = true -- Mark as used to prevent reuse
    WHERE user_id = p_user_id
    AND method = p_method
    AND verified = false;
    
    -- Create new request
    INSERT INTO two_factor_requests (
        user_id,
        method,
        code_hash,
        expires_at,
        ip_address
    ) VALUES (
        p_user_id,
        p_method,
        crypt(p_code, gen_salt('bf')),
        NOW() + (p_expiry_minutes || ' minutes')::INTERVAL,
        inet_client_addr()
    )
    RETURNING id INTO v_request_id;
    
    RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify 2FA code
CREATE OR REPLACE FUNCTION verify_2fa_code(
    p_request_id UUID,
    p_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_request RECORD;
BEGIN
    SELECT * INTO v_request
    FROM two_factor_requests
    WHERE id = p_request_id
    AND verified = false;
    
    IF v_request IS NULL THEN
        RETURN false;
    END IF;
    
    IF v_request.expires_at < NOW() THEN
        RETURN false;
    END IF;
    
    IF v_request.attempts >= v_request.max_attempts THEN
        RETURN false;
    END IF;
    
    -- Increment attempts
    UPDATE two_factor_requests
    SET attempts = attempts + 1
    WHERE id = p_request_id;
    
    -- Verify code
    IF crypt(p_code, v_request.code_hash) = v_request.code_hash THEN
        UPDATE two_factor_requests
        SET verified = true
        WHERE id = p_request_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to enable 2FA for user
CREATE OR REPLACE FUNCTION enable_2fa(
    p_user_id UUID,
    p_method VARCHAR,
    p_secret VARCHAR
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET 
        two_factor_enabled = true,
        two_factor_method = p_method,
        two_factor_secret = p_secret
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, activity_type, title, description)
    VALUES (p_user_id, 'security', 'Two-Factor Authentication Enabled', 
            '2FA has been enabled using ' || p_method);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable 2FA for user
CREATE OR REPLACE FUNCTION disable_2fa(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE profiles
    SET 
        two_factor_enabled = false,
        two_factor_method = NULL,
        two_factor_secret = NULL,
        two_factor_backup_codes = NULL
    WHERE id = p_user_id;
    
    -- Log activity
    INSERT INTO activity_logs (user_id, activity_type, title, description)
    VALUES (p_user_id, 'security', 'Two-Factor Authentication Disabled', 
            '2FA has been disabled');
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup old 2FA requests (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_2fa_requests()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM two_factor_requests
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
