import { DogBreed } from '@/types/game-types';

// Theme Palette
export const COLORS = {
  background: '#E6D5B8', // Soft Sand
  ground: '#634832',     // Dark Wood
  accent: '#C08261',     // Terra Cotta
  text: '#3D2C1E',       // Deep Espresso
  cream: '#F4EBD9',      // Cream
  success: '#4ADE80',
  danger: '#EF4444',
};

// Game Physics
export const GAME_CONFIG = {
  gravity: 0.6,
  baseSpeed: 5,
  maxSpeed: 12,
  floorHeight: 100,
  jumpForce: -12,
  spawnRate: 120, // Frames between spawns roughly
};

// Breeds
export const DOG_BREEDS: Record<string, DogBreed> = {
  golden: {
    id: 'golden',
    name: 'Golden Retriever',
    description: 'The balanced good boy.',
    speedStat: 5,
    jumpStat: 5,
    color: '#E3C059',
    unlockThreshold: 0, // Unlocked from the start
  },
  corgi: {
    id: 'corgi',
    name: 'Royal Corgi',
    description: 'Short legs, big hops!',
    speedStat: 4,
    jumpStat: 8, // Higher jump
    color: '#D68A59',
    unlockThreshold: 1000,
  },
  shiba: {
    id: 'shiba',
    name: 'Shiba Inu',
    description: 'Such speed. Much wow.',
    speedStat: 8, // Faster movement/reactions
    jumpStat: 6,
    color: '#C44E2E',
    unlockThreshold: 5000,
  },
};