export type DogBreedId = 'golden' | 'corgi' | 'shiba';

export interface DogBreed {
  id: DogBreedId;
  name: string;
  description: string;
  speedStat: number;
  jumpStat: number;
  color: string;
  unlockThreshold: number; // Points needed to unlock
}

export type GameStatus = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export interface UserProfile {
  id: string;
  total_points: number;
  unlocked_breeds: string[];
}

// Game Entities
export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle extends Entity {
  type: 'cat' | 'puddle' | 'mailman';
  speed: number;
}

export interface Treat extends Entity {
  collected: boolean;
  value: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}