-- Create user_gamification table for tracking points, levels, and ranks
CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    lifetime_points INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    xp INTEGER NOT NULL DEFAULT 0,
    xp_to_next_level INTEGER NOT NULL DEFAULT 100,
    rank VARCHAR(50) NOT NULL DEFAULT 'Bronze',
    streak_days INTEGER NOT NULL DEFAULT 0,
    last_active_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_gamification_points ON user_gamification(points DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_level ON user_gamification(level DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_rank ON user_gamification(rank);

-- Enable RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own gamification"
    ON user_gamification FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view leaderboard"
    ON user_gamification FOR SELECT
    USING (true);

-- Only system can modify gamification (via triggers/functions)
CREATE POLICY "System can modify gamification"
    ON user_gamification FOR ALL
    USING (false)
    WITH CHECK (false);

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION calculate_xp_to_next_level(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Exponential growth formula: base 100, increasing by 50% each level
    RETURN FLOOR(100 * POWER(1.5, current_level - 1));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine rank based on lifetime points
CREATE OR REPLACE FUNCTION determine_rank(lifetime_pts INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
    RETURN CASE
        WHEN lifetime_pts >= 100000 THEN 'Legend'
        WHEN lifetime_pts >= 50000 THEN 'Master'
        WHEN lifetime_pts >= 25000 THEN 'Diamond'
        WHEN lifetime_pts >= 10000 THEN 'Platinum'
        WHEN lifetime_pts >= 5000 THEN 'Gold'
        WHEN lifetime_pts >= 2000 THEN 'Silver'
        ELSE 'Bronze'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to level up user
CREATE OR REPLACE FUNCTION check_and_level_up()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has enough XP to level up
    WHILE NEW.xp >= NEW.xp_to_next_level LOOP
        NEW.xp := NEW.xp - NEW.xp_to_next_level;
        NEW.level := NEW.level + 1;
        NEW.xp_to_next_level := calculate_xp_to_next_level(NEW.level);
    END LOOP;
    
    -- Update rank based on lifetime points
    NEW.rank := determine_rank(NEW.lifetime_points);
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically level up users
CREATE TRIGGER trigger_level_up
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION check_and_level_up();

-- Function to initialize gamification for new users
CREATE OR REPLACE FUNCTION initialize_user_gamification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_gamification (user_id, points, lifetime_points, level, xp, xp_to_next_level, rank)
    VALUES (NEW.id, 0, 0, 1, 0, 100, 'Bronze');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create gamification record for new users
CREATE TRIGGER trigger_init_gamification
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_gamification();

-- Initialize existing users
INSERT INTO user_gamification (user_id, points, lifetime_points, level, xp, xp_to_next_level, rank)
SELECT id, 0, 0, 1, 0, 100, 'Bronze'
FROM profiles
WHERE id NOT IN (SELECT user_id FROM user_gamification);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_gamification;
