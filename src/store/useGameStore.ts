import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define character types
export type DogBreed = 'golden_retriever' | 'corgi' | 'shiba_inu';

export interface DogCharacter {
  id: DogBreed;
  name: string;
  description: string;
  speed: number;
  jumpHeight: number;
  agility: number;
  color: string;
}

export interface GameState {
  // Game state
  score: number;
  highScore: number;
  gameSpeed: number;
  isPlaying: boolean;
  isGameOver: boolean;
  level: number;
  combo: number;
  maxCombo: number;

  // Character selection
  selectedCharacter: DogBreed;
  availableCharacters: DogCharacter[];
  unlockedCharacters: DogBreed[];

  // Actions
  setScore: (score: number) => void;
  incrementScore: (points?: number) => void;
  resetScore: () => void;
  setHighScore: (highScore: number) => void;
  setPlaying: (isPlaying: boolean) => void;
  setGameOver: (isGameOver: boolean) => void;
  resetGame: () => void;
  setCombo: (combo: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  setSelectedCharacter: (character: DogBreed) => void;
  unlockCharacter: (character: DogBreed) => void;
  updateLevel: () => void;
  increaseGameSpeed: () => void;
  syncGameToDatabase: () => Promise<void>;
}

// Predefined dog characters with their attributes
const dogCharacters: DogCharacter[] = [
  {
    id: 'golden_retriever',
    name: 'Golden Retriever',
    description: 'Faster movement speed',
    speed: 1.2,
    jumpHeight: 1,
    agility: 1,
    color: '#F4D160' // Yellow/amber color for golden retriever
  },
  {
    id: 'corgi',
    name: 'Corgi',
    description: 'Higher jump ability',
    speed: 1,
    jumpHeight: 1.3,
    agility: 1,
    color: '#C08261' // Terra cotta color for corgi
  },
  {
    id: 'shiba_inu',
    name: 'Shiba Inu',
    description: 'Better agility and dodging',
    speed: 1,
    jumpHeight: 1,
    agility: 1.2,
    color: '#E6D5B8' // Light brown/tan color for shiba inu
  }
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      score: 0,
      highScore: 0,
      gameSpeed: 1,
      isPlaying: false,
      isGameOver: false,
      level: 1,
      combo: 0,
      maxCombo: 0,
      selectedCharacter: 'golden_retriever',
      availableCharacters: dogCharacters,
      unlockedCharacters: ['golden_retriever'], // Initially only golden retriever is unlocked

      // Actions
      setScore: (score) => set({ score }),
      incrementScore: (points = 1) => {
        const current = get();
        const newScore = current.score + points;
        set({
          score: newScore,
          highScore: Math.max(newScore, current.highScore),
          combo: current.combo + 1
        });

        // Check if level needs to be updated
        if (Math.floor(newScore / 100) > current.level) {
          get().updateLevel();
        }
      },
      resetScore: () => set({ score: 0 }),

      setHighScore: (highScore) => set({ highScore }),

      setPlaying: (isPlaying) => set({ isPlaying }),

      setGameOver: (isGameOver) => set({ isGameOver }),

      resetGame: () => set({
        score: 0,
        isPlaying: false,
        isGameOver: false,
        combo: 0,
        gameSpeed: 1
      }),

      setCombo: (combo) => set({ combo }),
      incrementCombo: () => {
        const current = get();
        const newCombo = current.combo + 1;
        return set({ combo: newCombo, maxCombo: Math.max(newCombo, current.maxCombo) });
      },
      resetCombo: () => set({ combo: 0 }),

      setSelectedCharacter: (character) => set({ selectedCharacter: character }),

      unlockCharacter: (character) => {
        const current = get();
        if (!current.unlockedCharacters.includes(character)) {
          set({
            unlockedCharacters: [...current.unlockedCharacters, character]
          });
        }
      },

      updateLevel: () => {
        const current = get();
        const newLevel = Math.floor(current.score / 100) + 1;
        set({ level: newLevel });

        // Increase game speed as level increases
        get().increaseGameSpeed();
      },

      increaseGameSpeed: () => {
        const current = get();
        // Increase game speed gradually based on level
        set({ gameSpeed: 1 + (current.level * 0.1) });
      },

      syncGameToDatabase: async () => {
        const current = get();

        // Import the sync function dynamically to avoid SSR issues
        const { syncGameResult } = await import('@/lib/game/supabase-game-sync');

        const gameResult = {
          score: current.score,
          level: current.level,
        };

        const updatedProfile = await syncGameResult(gameResult);

        if (updatedProfile) {
          // Update the unlocked characters based on the database
          set({
            unlockedCharacters: updatedProfile.unlocked_breeds as DogBreed[],
            level: updatedProfile.level,
          });
        }
      }
    }),
    {
      name: 'game-storage', // Name of the item in localStorage
      partialize: (state) => ({
        highScore: state.highScore,
        selectedCharacter: state.selectedCharacter,
        unlockedCharacters: state.unlockedCharacters
      }), // Persist only these values
    }
  )
);