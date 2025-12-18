// Supabase sync functions that should be used only on the client side
// or in server actions

export interface GameResult {
  score: number;
  level: number;
  // Add other game metrics as needed
}

export interface UserProfile {
  id: string;
  points_balance: number;
  level: number;
  unlocked_breeds: string[];
}

/**
 * Updates the user's profile in the database with game results
 * @param gameResult - The game results to sync to the database
 * @returns The updated user profile or null if failed
 */
export async function syncGameResult(gameResult: GameResult): Promise<UserProfile | null> {
  try {
    // Dynamically import the client to avoid SSR issues
    const { createClient } = await import('@/lib/supabase/client');

    const supabase = createClient();

    // Get the current user session
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }

    // Fetch current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, points_balance, level, unlocked_breeds')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    // Calculate new points (add game score to existing points)
    const newPoints = profile.points_balance + gameResult.score;

    // Check if user should level up
    const currentLevel = profile.level;
    const newLevel = Math.max(currentLevel, gameResult.level);

    // Determine if new breeds should be unlocked based on level
    const currentUnlockedBreeds = [...profile.unlocked_breeds];
    const newBreedsToUnlock: string[] = [];

    // Logic to unlock breeds based on level - adjust as needed
    if (newLevel >= 3 && !currentUnlockedBreeds.includes('corgi')) {
      newBreedsToUnlock.push('corgi');
    }
    if (newLevel >= 5 && !currentUnlockedBreeds.includes('shiba_inu')) {
      newBreedsToUnlock.push('shiba_inu');
    }

    // Create final list of unlocked breeds
    const finalUnlockedBreeds = [
      ...new Set([...currentUnlockedBreeds, ...newBreedsToUnlock])
    ];

    // Update the user's profile with new points, level, and unlocked breeds
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        points_balance: newPoints,
        level: newLevel,
        unlocked_breeds: finalUnlockedBreeds,
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return null;
    }

    return updatedProfile as UserProfile;
  } catch (error) {
    console.error('Unexpected error in syncGameResult:', error);
    return null;
  }
}

/**
 * Fetches the user's current profile from the database
 * @returns The current user profile or null if failed
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, points_balance, level, unlocked_breeds')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Unexpected error in getUserProfile:', error);
    return null;
  }
}

/**
 * Updates only the points in the user's profile
 * @param pointsToAdd - The number of points to add to the user's balance
 * @returns The updated user profile or null if failed
 */
export async function addPointsToUser(pointsToAdd: number): Promise<UserProfile | null> {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return null;
    }

    // Fetch the current points to calculate the new total
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('points_balance')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return null;
    }

    const newPoints = profile.points_balance + pointsToAdd;

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points_balance: newPoints })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating points:', updateError);
      return null;
    }

    return updatedProfile as UserProfile;
  } catch (error) {
    console.error('Unexpected error in addPointsToUser:', error);
    return null;
  }
}