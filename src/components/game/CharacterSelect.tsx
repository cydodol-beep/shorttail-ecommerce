import React from 'react';
import { useGameStore } from '@/store/useGameStore';
import { DOG_BREEDS, COLORS } from '@/constants/game-constants';
import { Lock, Check, Zap, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const CharacterSelect: React.FC = () => {
  const { selectedBreed, setBreed, userProfile, setStatus } = useGameStore();

  return (
    <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl mx-auto p-4 animate-in fade-in zoom-in duration-300">
      <h2 className="text-4xl font-bold mb-2" style={{ color: COLORS.text }}>Choose Your Pup</h2>
      <p className="mb-8 opacity-80" style={{ color: COLORS.text }}>Each breed has unique abilities!</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-8">
        {Object.values(DOG_BREEDS).map((breed) => {
          const isUnlocked = userProfile.unlocked_breeds.includes(breed.id);
          const isSelected = selectedBreed === breed.id;

          return (
            <div 
              key={breed.id}
              onClick={() => isUnlocked && setBreed(breed.id)}
              className={`
                relative p-6 rounded-2xl border-4 transition-all duration-200 cursor-pointer
                flex flex-col items-center text-center group
                ${isSelected ? 'border-[#C08261] bg-white scale-105 shadow-xl' : 'border-transparent bg-white/50 hover:bg-white/80'}
                ${!isUnlocked ? 'opacity-70 grayscale' : ''}
              `}
            >
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/10 rounded-xl flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                  <Lock className="w-8 h-8 mb-2 text-[#3D2C1E]" />
                  <span className="font-bold text-sm bg-[#3D2C1E] text-[#F4EBD9] px-2 py-1 rounded">
                    Unlock at {breed.unlockThreshold} pts
                  </span>
                </div>
              )}

              {isSelected && (
                <div className="absolute -top-3 -right-3 bg-[#4ADE80] text-white p-1 rounded-full shadow-md z-20">
                  <Check size={20} />
                </div>
              )}

              {/* Dog Placeholder Avatar */}
              <div 
                className="w-24 h-24 rounded-full mb-4 shadow-inner flex items-center justify-center text-4xl transform group-hover:scale-110 transition-transform"
                style={{ backgroundColor: breed.color }}
              >
                🐕
              </div>

              <h3 className="text-xl font-bold mb-1" style={{ color: COLORS.text }}>{breed.name}</h3>
              <p className="text-sm mb-4 h-10 opacity-70 leading-tight">{breed.description}</p>

              {/* Stats */}
              <div className="w-full space-y-2">
                <div className="flex items-center text-xs font-bold gap-2">
                  <Zap size={14} className="text-[#C08261]" />
                  <div className="w-full bg-[#E6D5B8] rounded-full h-2">
                    <div className="bg-[#C08261] h-2 rounded-full" style={{ width: `${(breed.speedStat / 10) * 100}%` }}></div>
                  </div>
                </div>
                <div className="flex items-center text-xs font-bold gap-2">
                  <ArrowUp size={14} className="text-[#634832]" />
                  <div className="w-full bg-[#E6D5B8] rounded-full h-2">
                    <div className="bg-[#634832] h-2 rounded-full" style={{ width: `${(breed.jumpStat / 10) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button onClick={() => setStatus('PLAYING')} size="lg" className="w-64">
        Play with {DOG_BREEDS[selectedBreed].name}
      </Button>
    </div>
  );
};