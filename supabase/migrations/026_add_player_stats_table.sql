-- Add player_stats table for the game functionality
CREATE TABLE public.player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_name TEXT DEFAULT 'ShortTail',
  level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
  points INTEGER DEFAULT 0 CHECK (points >= 0),
  current_exp INTEGER DEFAULT 0 CHECK (current_exp >= 0),
  max_exp INTEGER DEFAULT 100 CHECK (max_exp >= 0),
  last_login_date TEXT,
  last_quest_reset_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own stats" ON public.player_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON public.player_stats
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats" ON public.player_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_player_stats_user_id ON public.player_stats(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
CREATE TRIGGER update_player_stats_updated_at 
  BEFORE UPDATE ON public.player_stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();