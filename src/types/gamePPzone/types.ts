export interface PlayerStats {
  points: number;
  level: number;
  currentExp: number;
  maxExp: number;
  petName: string;
  lastLoginDate?: string;
  lastQuestResetDate?: string;
}

export interface Quest {
  id: string;
  type: 'catch_items' | 'accumulate_score' | 'feed_pet';
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  rewardPoints: number;
  rewardExp: number;
}

export interface GameItem {
  id: string;
  x: number;
  y: number;
  type: 'bone' | 'poop' | 'toy' | 'golden_bone';
  rotation: number;
}

export interface GameState {
  stats: PlayerStats;
  quests: Quest[];
  addPoints: (amount: number) => void;
  addExp: (amount: number) => void;
  setPetName: (name: string) => void;
  syncToSupabase: () => Promise<void>;
  feedPet: () => void;
  petDog: () => void;
  checkDailyBonus: () => boolean;
  checkDailyQuestsReset: () => void;
  updateQuestProgress: (type: Quest['type'], amount: number) => void;
  claimQuestReward: (questId: string) => void;
}

export interface GameConfig {
  GAME_WIDTH: number;
  GAME_HEIGHT: number;
  DOG_SIZE: number;
  ITEM_SIZE: number;
  SPAWN_RATE: number;
  FALL_SPEED: number;
}