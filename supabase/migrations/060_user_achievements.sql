-- Create achievements catalog table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100) NOT NULL DEFAULT 'award',
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    points_reward INTEGER NOT NULL DEFAULT 0,
    xp_reward INTEGER NOT NULL DEFAULT 0,
    requirement_type VARCHAR(50) NOT NULL, -- 'points', 'orders', 'streak', 'referrals', etc.
    requirement_value INTEGER NOT NULL DEFAULT 1,
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    progress INTEGER NOT NULL DEFAULT 0,
    is_claimed BOOLEAN NOT NULL DEFAULT false,
    claimed_at TIMESTAMPTZ,
    UNIQUE(user_id, achievement_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked ON user_achievements(unlocked_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Policies for achievements
CREATE POLICY "Anyone can view achievements catalog"
    ON achievements FOR SELECT
    USING (true);

CREATE POLICY "Users can view own achievements"
    ON user_achievements FOR SELECT
    USING (auth.uid() = user_id);

-- System can manage achievements
CREATE POLICY "System can manage achievements"
    ON user_achievements FOR ALL
    USING (false)
    WITH CHECK (false);

-- Insert default achievements
INSERT INTO achievements (key, name, description, icon, category, points_reward, xp_reward, requirement_type, requirement_value) VALUES
-- Points-based achievements
('first_steps', 'First Steps', 'Earn your first 100 points', 'footprints', 'points', 50, 25, 'points', 100),
('point_collector', 'Point Collector', 'Accumulate 1,000 points', 'coins', 'points', 100, 50, 'points', 1000),
('point_hoarder', 'Point Hoarder', 'Accumulate 5,000 points', 'treasure-chest', 'points', 250, 100, 'points', 5000),
('wealthy_pet_parent', 'Wealthy Pet Parent', 'Accumulate 10,000 points', 'crown', 'points', 500, 200, 'points', 10000),

-- Order-based achievements
('first_purchase', 'First Purchase', 'Complete your first order', 'shopping-bag', 'orders', 100, 50, 'orders', 1),
('regular_customer', 'Regular Customer', 'Complete 5 orders', 'package', 'orders', 200, 100, 'orders', 5),
('loyal_customer', 'Loyal Customer', 'Complete 20 orders', 'truck', 'orders', 500, 200, 'orders', 20),
('vip_customer', 'VIP Customer', 'Complete 50 orders', 'star', 'orders', 1000, 500, 'orders', 50),

-- Streak achievements
('week_warrior', 'Week Warrior', 'Maintain a 7-day login streak', 'flame', 'streak', 150, 75, 'streak', 7),
('month_master', 'Month Master', 'Maintain a 30-day login streak', 'calendar-check', 'streak', 500, 250, 'streak', 30),
('dedicated_parent', 'Dedicated Parent', 'Maintain a 100-day login streak', 'award', 'streak', 2000, 1000, 'streak', 100),

-- Level achievements
('leveling_up', 'Leveling Up', 'Reach level 5', 'trending-up', 'level', 200, 100, 'level', 5),
('experienced', 'Experienced', 'Reach level 10', 'zap', 'level', 500, 250, 'level', 10),
('master', 'Master', 'Reach level 25', 'crown', 'level', 1000, 500, 'level', 25),
('legend', 'Legend', 'Reach level 50', 'gem', 'level', 5000, 2000, 'level', 50),

-- Social achievements
('referrer', 'Referrer', 'Refer your first friend', 'user-plus', 'social', 300, 150, 'referrals', 1),
('influencer', 'Influencer', 'Refer 5 friends', 'users', 'social', 1000, 500, 'referrals', 5),
('ambassador', 'Ambassador', 'Refer 10 friends', 'megaphone', 'social', 2500, 1000, 'referrals', 10),

-- Review achievements
('first_review', 'First Review', 'Write your first product review', 'message-square', 'reviews', 100, 50, 'reviews', 1),
('helpful_reviewer', 'Helpful Reviewer', 'Write 10 product reviews', 'thumbs-up', 'reviews', 300, 150, 'reviews', 10),
('top_reviewer', 'Top Reviewer', 'Write 25 product reviews', 'pen-tool', 'reviews', 750, 350, 'reviews', 25),

-- Special achievements
('early_bird', 'Early Bird', 'Create an account during our launch month', 'sunrise', 'special', 500, 250, 'account_age', 30),
('profile_complete', 'Profile Complete', 'Complete all profile fields', 'user-check', 'special', 200, 100, 'profile_complete', 1),
('mobile_user', 'Mobile User', 'Login via mobile app', 'smartphone', 'special', 150, 75, 'mobile_login', 1);

-- Function to initialize achievements for new users
CREATE OR REPLACE FUNCTION initialize_user_achievements()
RETURNS TRIGGER AS $$
BEGIN
    -- Create progress records for all achievements
    INSERT INTO user_achievements (user_id, achievement_id, progress, is_claimed)
    SELECT NEW.user_id, id, 0, false
    FROM achievements;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create achievement progress for new gamification records
CREATE TRIGGER trigger_init_achievements
    AFTER INSERT ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_achievements();

-- Function to check and unlock achievements
CREATE OR REPLACE FUNCTION check_achievements(
    p_user_id UUID,
    p_requirement_type VARCHAR(50),
    p_current_value INTEGER
)
RETURNS TABLE(achievement_name VARCHAR, points_reward INTEGER, xp_reward INTEGER) AS $$
BEGIN
    RETURN QUERY
    WITH unlocked AS (
        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at, progress, is_claimed)
        SELECT 
            p_user_id,
            a.id,
            NOW(),
            p_current_value,
            false
        FROM achievements a
        WHERE a.requirement_type = p_requirement_type
        AND a.requirement_value <= p_current_value
        AND NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = p_user_id 
            AND ua.achievement_id = a.id
        )
        RETURNING achievement_id
    )
    SELECT a.name, a.points_reward, a.xp_reward
    FROM achievements a
    JOIN unlocked u ON a.id = u.achievement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim achievement rewards
CREATE OR REPLACE FUNCTION claim_achievement_reward(p_user_id UUID, p_achievement_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_points INTEGER;
    v_xp INTEGER;
BEGIN
    -- Get achievement rewards
    SELECT points_reward, xp_reward INTO v_points, v_xp
    FROM achievements WHERE id = p_achievement_id;
    
    -- Update user_achievements as claimed
    UPDATE user_achievements
    SET is_claimed = true, claimed_at = NOW()
    WHERE user_id = p_user_id
    AND achievement_id = p_achievement_id
    AND unlocked_at IS NOT NULL
    AND is_claimed = false;
    
    IF FOUND THEN
        -- Add rewards to gamification
        UPDATE user_gamification
        SET 
            points = points + v_points,
            lifetime_points = lifetime_points + v_points,
            xp = xp + v_xp
        WHERE user_id = p_user_id;
        
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_achievements;

-- Initialize achievements for existing users
INSERT INTO user_achievements (user_id, achievement_id, progress, is_claimed)
SELECT ug.user_id, a.id, 0, false
FROM user_gamification ug
CROSS JOIN achievements a
WHERE NOT EXISTS (
    SELECT 1 FROM user_achievements ua 
    WHERE ua.user_id = ug.user_id 
    AND ua.achievement_id = a.id
);
