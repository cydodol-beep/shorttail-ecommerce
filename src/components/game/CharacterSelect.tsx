'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGameStore, DogBreed, DogCharacter } from '@/store/useGameStore';
import { Dog } from 'lucide-react';

interface CharacterSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CharacterSelect({ open, onOpenChange }: CharacterSelectProps) {
  const { availableCharacters, unlockedCharacters, selectedCharacter, setSelectedCharacter } = useGameStore();

  // Function to handle character selection
  const handleSelectCharacter = (character: DogBreed) => {
    if (unlockedCharacters.includes(character)) {
      setSelectedCharacter(character);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#E6D5B8] border-[#C08261] dark:bg-[#3D2C1E] dark:border-[#634832]">
        <DialogHeader>
          <DialogTitle className="text-center text-[#3D2C1E] dark:text-[#E6D5B8]">
            Choose Your Dog
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
          {availableCharacters.map((character: DogCharacter) => {
            const isUnlocked = unlockedCharacters.includes(character.id);
            const isSelected = selectedCharacter === character.id;
            
            return (
              <motion.div
                key={character.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative rounded-xl p-4 border-2 flex flex-col items-center justify-center
                  transition-all duration-200 cursor-pointer
                  ${isSelected 
                    ? 'border-[#634832] bg-[#D4B99C] dark:border-[#C08261] dark:bg-[#5A4735]' 
                    : 'border-[#C08261] bg-[#F0E6D6] hover:bg-[#D4B99C] dark:border-[#634832] dark:bg-[#4D3D2E] dark:hover:bg-[#5A4735]'
                  }
                  ${!isUnlocked ? 'opacity-50 grayscale' : ''}
                `}
                onClick={() => isUnlocked && handleSelectCharacter(character.id)}
              >
                {isUnlocked ? (
                  <>
                    <div 
                      className="w-16 h-16 rounded-full flex items-center justify-center mb-2"
                      style={{ backgroundColor: character.color }}
                    >
                      <Dog className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">{character.name}</h3>
                    <p className="text-xs text-center text-[#6B533D] dark:text-[#B8A090] mt-1">
                      {character.description}
                    </p>
                    <div className="grid grid-cols-3 gap-1 mt-2 w-full">
                      <div className="text-center">
                        <span className="block text-[10px] text-[#6B533D] dark:text-[#B8A090]">Speed</span>
                        <span className="block text-sm font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">{character.speed}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] text-[#6B533D] dark:text-[#B8A090]">Jump</span>
                        <span className="block text-sm font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">{character.jumpHeight}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] text-[#6B533D] dark:text-[#B8A090]">Agility</span>
                        <span className="block text-sm font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">{character.agility}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-6">
                    <div className="w-12 h-12 rounded-full bg-[#C08261] dark:bg-[#634832] flex items-center justify-center mb-2">
                      <span className="text-white text-2xl">?</span>
                    </div>
                    <p className="text-sm text-center text-[#6B533D] dark:text-[#B8A090]">
                      Unlock at level {character.id === 'corgi' ? '3' : character.id === 'shiba_inu' ? '5' : '1'}
                    </p>
                  </div>
                )}
                
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-[#C08261] dark:bg-[#634832] rounded-full p-1">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
        
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="border-[#634832] text-[#3D2C1E] hover:bg-[#D4B99C] dark:border-[#C08261] dark:text-[#E6D5B8] dark:hover:bg-[#5A4735]"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}