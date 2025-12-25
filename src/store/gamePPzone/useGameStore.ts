import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PlayerStats, GameState, Quest, GameItem, GameConfig } from '@/types/gamePPzone/types';
import { createClient } from '@/lib/supabase/client';
import { playSound } from '@/lib/gamePPzone/sound';

const DEFAULT_QUESTS: Quest[] = [
  {
    id: 'q1',
    type: 'catch_items',
    description: 'Catch 20 Treats',
    target: 20,
    progress: 0,
    completed: false,
    claimed: false,
    rewardPoints: 30,
    rewardExp: 50
  },
  {
    id: 'q2',
    type: 'accumulate_score',
    description: 'Score 300 Points Today',
    target: 300,
    progress: 0,
    completed: false,
    claimed: false,
    rewardPoints: 50,
    rewardExp: 80
  },
  {
    id: 'q3',
    type: 'feed_pet',
    description: 'Feed your Pet 3 times',
    target: 3,
    progress: 0,
    completed: false,
    claimed: false,
    rewardPoints: 20,
    rewardExp: 40
  }
];

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      stats: {
        points: 50, // Start with some points
        level: 1,
        currentExp: 0,
        maxExp: 100, // Level 1 * 100
        petName: 'Doggo',
        lastLoginDate: '',
        lastQuestResetDate: '',
      },
      quests: DEFAULT_QUESTS,

      init: async () => {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          console.error('Auth error during initialization:', authError);
          return;
        }

        const { data, error } = await supabase
          .from('player_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching player stats:', error);
          // If no record exists, the store will use the default values
          return;
        }

        if (data) {
          set({
            stats: {
              points: data.points || 0,
              level: data.level || 1,
              currentExp: data.current_exp || 0,
              maxExp: data.max_exp !== null && data.max_exp !== undefined ? data.max_exp : 100,
              petName: data.pet_name || 'Doggo',
              lastLoginDate: data.last_login_date || '',
              lastQuestResetDate: data.last_quest_reset_date || '',
            }
          });
        }
      },

      syncToSupabase: async () => {
        const { stats } = get();
        try {
          const supabase = createClient();
          const { data: { user }, error: authError } = await supabase.auth.getUser();

          if (authError || !user) {
            console.error('Auth error in syncToSupabase:', authError);
            return;
          }

          if (user) {
            const { error } = await supabase
              .from('player_stats')
              .upsert({
                user_id: user.id,
                pet_name: stats.petName,
                level: stats.level,
                points: stats.points,
                current_exp: stats.currentExp,
                max_exp: stats.maxExp,
                last_login_date: stats.lastLoginDate,
                last_quest_reset_date: stats.lastQuestResetDate,
              }, { onConflict: 'user_id' });

            if (error) {
                console.error('Supabase sync error:', error);
            }
          }
        } catch (err) {
          console.warn('Sync skipped (Auth/Network issue):', err);
        }
      },

      setPetName: (name) => {
        set((state) => ({
          stats: { ...state.stats, petName: name }
        }));
        get().syncToSupabase();
      },

      addPoints: (amount) => {
        set((state) => ({
          stats: {
            ...state.stats,
            points: Math.max(0, state.stats.points + amount),
          },
        }));
        get().syncToSupabase();
      },

      addExp: (amount) => {
        set((state) => {
          let { level, currentExp, maxExp, points, petName, lastLoginDate, lastQuestResetDate } = state.stats;
          
          // If max level, just accumulate points, no EXP gain
          if (level >= 100) {
            return { state };
          }

          let newExp = currentExp + amount;
          let newLevel = level;
          let newMaxExp = maxExp;
          
          // Level Up Logic
          // Loop handles multiple levels at once if huge EXP is granted
          while (newExp >= newMaxExp && newLevel < 100) {
            newExp = newExp - newMaxExp;
            newLevel += 1;
            newMaxExp = newLevel * 100; // Curve: Lvl * 100
            // Bonus points for leveling up
            points += 50; 
            playSound('levelUp');
          }
          
          // Cap at level 100
          if (newLevel === 100) {
             newExp = 0;
             newMaxExp = 0; // Maxed out
          }

          return {
            stats: {
              level: newLevel,
              currentExp: newExp,
              maxExp: newMaxExp,
              points,
              petName,
              lastLoginDate,
              lastQuestResetDate
            },
          };
        });
        get().syncToSupabase();
      },

      feedPet: () => {
        const { points, level } = get().stats;
        const FEED_COST = 20;
        const FEED_EXP = 15;

        if (points >= FEED_COST) {
           // Reuse addExp logic for DRY principles
           set((state) => ({
             stats: { ...state.stats, points: state.stats.points - FEED_COST }
           }));
           get().addExp(FEED_EXP);
           
           get().updateQuestProgress('feed_pet', 1);
        }
      },

      petDog: () => {
        const PET_COST = 5;
        const PET_EXP = 5;
        const { points } = get().stats;

        if (points >= PET_COST) {
           set((state) => ({
             stats: { ...state.stats, points: state.stats.points - PET_COST }
           }));
           get().addExp(PET_EXP);
        }
      },

      checkDailyBonus: () => {
        const today = new Date().toDateString();
        const { stats } = get();

        if (stats.lastLoginDate !== today) {
          set((state) => ({
            stats: {
              ...state.stats,
              points: state.stats.points + 25,
              lastLoginDate: today
            }
          }));
          get().syncToSupabase();
          return true;
        }
        return false;
      },

      checkDailyQuestsReset: () => {
        const today = new Date().toDateString();
        const { stats } = get();

        if (stats.lastQuestResetDate !== today) {
          console.log("Resetting Daily Quests for new day...");
          set((state) => ({
            quests: DEFAULT_QUESTS.map(q => ({ ...q, progress: 0, completed: false, claimed: false })),
            stats: {
              ...state.stats,
              lastQuestResetDate: today
            }
          }));
          get().syncToSupabase();
        }
      },

      updateQuestProgress: (type, amount) => {
        set((state) => {
          const updatedQuests = state.quests.map((quest) => {
            if (quest.type === type && !quest.completed) {
              const newProgress = Math.min(quest.target, quest.progress + amount);
              const isNowCompleted = newProgress >= quest.target;
              return { ...quest, progress: newProgress, completed: isNowCompleted };
            }
            return quest;
          });

          return { quests: updatedQuests };
        });
        get().syncToSupabase();
      },

      claimQuestReward: (questId) => {
        set((state) => {
            const questIndex = state.quests.findIndex(q => q.id === questId);
            if (questIndex === -1) return state;

            const quest = state.quests[questIndex];
            
            if (quest.completed && !quest.claimed) {
                // Mark claimed first
                const updatedQuests = [...state.quests];
                updatedQuests[questIndex] = { ...quest, claimed: true };
                
                // Add points
                set((prev) => ({ 
                    stats: { ...prev.stats, points: prev.stats.points + quest.rewardPoints },
                    quests: updatedQuests
                }));

                // Add Exp (which handles level up internally via the public action, 
                // but since we are inside set, we have to duplicate logic or be careful.
                // It's safer to call the action outside, but for atomic state updates in Zustand:
                
                // We will manually invoke addExp's logic logic here or simpler:
                // Update state for points/claimed, THEN call get().addExp() asynchronously/next tick?
                // No, let's just do math here.
                
                let { level, currentExp, maxExp, points } = get().stats; // Get FRESH stats after points update
                let newExp = currentExp + quest.rewardExp;
                
                 while (newExp >= maxExp && level < 100) {
                    newExp -= maxExp;
                    level += 1;
                    maxExp = level * 100;
                    points += 50; 
                }
                
                if (level === 100) { newExp = 0; maxExp = 0; }

                return {
                    stats: { ...state.stats, points, level, currentExp: newExp, maxExp },
                    quests: updatedQuests
                };
            }
            return state;
        });
        get().syncToSupabase();
      }
    }),
    {
      name: 'paw-play-zone-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);