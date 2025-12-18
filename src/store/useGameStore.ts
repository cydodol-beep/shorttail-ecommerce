import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStatus, DogBreedId, UserProfile } from '@/types/game-types';
import { DOG_BREEDS } from '@/constants/game-constants';

interface GameState {
  // Session State
  status: GameStatus;
  score: number;
  highScore: number;
  combo: number;

  // User/Meta State
  selectedBreed: DogBreedId;
  userProfile: UserProfile;
  newUnlock: DogBreedId | null;

  // Actions
  setStatus: (status: GameStatus) => void;
  addScore: (points: number) => void;
  resetGame: () => void;
  setBreed: (breed: DogBreedId) => void;
  unlockBreed: (breed: DogBreedId) => void;
  syncTotalPoints: (sessionPoints: number) => void;
  resetCombo: () => void;
  incrementCombo: () => void;
  clearNewUnlock: () => void;
  loadUserProfile: () => Promise<void>;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      status: 'MENU',
      score: 0,
      highScore: 0,
      combo: 0,
      selectedBreed: 'golden',
      userProfile: {
        id: 'guest-user',
        total_points: 0,
        unlocked_breeds: ['golden'],
      },
      newUnlock: null,

      setStatus: (status) => set({ status }),

      addScore: (points) => {
        const { score, highScore, combo } = get();
        // Combo multiplier logic: (1 + floor(combo / 5))
        const multiplier = 1 + Math.floor(combo / 5);
        const newScore = score + (points * multiplier);

        set({
          score: newScore,
          highScore: Math.max(newScore, highScore)
        });
      },

      incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),

      resetCombo: () => set({ combo: 0 }),

      resetGame: () => set({ score: 0, combo: 0, status: 'PLAYING' }),

      setBreed: (breed) => set({ selectedBreed: breed }),

      unlockBreed: (breed) => set((state) => ({
        userProfile: {
          ...state.userProfile,
          unlocked_breeds: [...state.userProfile.unlocked_breeds, breed]
        }
      })),

      syncTotalPoints: (sessionPoints) => set((state) => {
        const newTotal = state.userProfile.total_points + sessionPoints;

        // Simple local check for unlocks based on new total
        const currentUnlocks = new Set(state.userProfile.unlocked_breeds);
        let newlyUnlocked: DogBreedId | null = null;

        Object.values(DOG_BREEDS).forEach(breed => {
          if (newTotal >= breed.unlockThreshold && !currentUnlocks.has(breed.id)) {
            currentUnlocks.add(breed.id);
            newlyUnlocked = breed.id as DogBreedId;
          }
        });

        return {
          userProfile: {
            ...state.userProfile,
            total_points: newTotal,
            unlocked_breeds: Array.from(currentUnlocks)
          },
          newUnlock: newlyUnlocked
        };
      }),

      clearNewUnlock: () => set({ newUnlock: null }),

      // Load user profile from the database
      loadUserProfile: async () => {
        try {
          // Dynamically import the supabase client to avoid SSR issues
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();

          // Get current user
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            console.error('Error getting user:', authError);
            return;
          }

          // Fetch user profile
          const { data, error } = await supabase
            .from('profiles')
            .select('id, points_balance, unlocked_breeds')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching user profile:', error);
            // User might not have a profile yet, initialize with defaults
            set({
              userProfile: {
                id: user.id,
                total_points: 0,
                unlocked_breeds: ['golden'],
              }
            });
            return;
          }

          // Update the store with the fetched profile
          set({
            userProfile: {
              id: user.id,
              total_points: data.points_balance,
              unlocked_breeds: data.unlocked_breeds || ['golden'],
            }
          });
        } catch (error) {
          console.error('Unexpected error in loadUserProfile:', error);
        }
      }
    }),
    {
      name: 'paws-paths-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);