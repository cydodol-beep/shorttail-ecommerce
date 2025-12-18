import { UserProfile } from '@/types/game-types';
import { createClient } from '@/lib/supabase/client';

/**
 * Update user profile in the database with new points and unlocks
 */
export const updateUserProfile = async (profile: UserProfile): Promise<{ error: any, data: UserProfile | null }> => {
  try {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        points_balance: profile.total_points,
        unlocked_breeds: profile.unlocked_breeds,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { error, data: null };
    }

    return { error: null, data: data as UserProfile };
  } catch (error) {
    console.error('Unexpected error in updateUserProfile:', error);
    return { error, data: null };
  }
};

/**
 * Fetch leaderboard data
 */
export const fetchLeaderboard = async () => {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('user_name, points_balance')
      .order('points_balance', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }

    return data.map((profile: any) => ({
      name: profile.user_name || 'Anonymous',
      points: profile.points_balance
    }));
  } catch (error) {
    console.error('Unexpected error in fetchLeaderboard:', error);
    return [];
  }
};