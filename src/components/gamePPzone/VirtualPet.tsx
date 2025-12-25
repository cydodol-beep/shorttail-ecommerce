import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Utensils, Trophy, Sparkles, Pencil, Check, X } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { Button } from './ui/Button';
import { playSound } from '../lib/sound';
import { DogAvatar } from './GameAssets';

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

export const VirtualPet: React.FC = () => {
  const { stats, feedPet, petDog, setPetName } = useGameStore();
  const [petAction, setPetAction] = useState<'idle' | 'happy' | 'eating'>('idle');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(stats.petName);
  const nextParticleId = useRef(0);

  // Calculate Level Progress Percentage
  const progress = Math.min(100, (stats.currentExp / stats.maxExp) * 100);

  const spawnParticles = (count: number) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: nextParticleId.current++,
        x: (Math.random() - 0.5) * 100, // Random Spread
        y: (Math.random() - 0.5) * 50,
        rotation: Math.random() * 360,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    // Cleanup after animation
    setTimeout(() => {
      setParticles(prev => prev.slice(count));
    }, 1500);
  };

  const handleFeed = () => {
    if (stats.points < 20) {
      playSound('hit'); // Negative sound
      return;
    }
    setPetAction('eating');
    spawnParticles(8); // Crumbs
    feedPet();
    playSound('happy');
    setTimeout(() => setPetAction('idle'), 2000);
  };

  const handlePet = () => {
    if (stats.points < 5) {
      playSound('hit');
      return;
    }
    setPetAction('happy');
    spawnParticles(5); // Hearts
    petDog();
    playSound('happy');
    setTimeout(() => setPetAction('idle'), 2000);
  };

  const saveName = () => {
    if (tempName.trim()) {
      setPetName(tempName.trim());
      playSound('click');
    } else {
      setTempName(stats.petName); // Revert if empty
    }
    setIsEditingName(false);
  };

  const cancelEdit = () => {
    setTempName(stats.petName);
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') cancelEdit();
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-teal-100 w-full flex flex-col items-center relative overflow-hidden transition-all">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-28 bg-cream rounded-b-[40%] -z-0"></div>

      {/* Level Badge */}
      <div className="absolute top-4 right-4 bg-teal-700 text-white px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1 shadow-md z-10">
        <Trophy size={14} />
        Lvl {stats.level}
      </div>

      {/* Pet Name & Display */}
      <div className="mt-2 relative z-10 w-full flex flex-col items-center">
        <div className="flex items-center gap-2 mb-2 h-10">
          {isEditingName ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center bg-white border-2 border-teal-200 rounded-xl px-1 py-1 shadow-sm"
            >
              <input 
                type="text" 
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveName} // Save on click away
                onKeyDown={handleKeyDown}
                maxLength={12}
                autoFocus
                className="bg-transparent text-teal-900 font-bold text-xl text-center w-32 focus:outline-none placeholder-teal-300"
                placeholder="Name?"
              />
              <div className="flex border-l border-teal-100 pl-1 ml-1 gap-1">
                <button 
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur from firing before click
                  onClick={saveName} 
                  className="p-1 hover:bg-green-100 rounded text-green-600 transition-colors"
                >
                  <Check size={18} />
                </button>
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={cancelEdit} 
                  className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="group flex items-center gap-2 px-3 py-1 rounded-xl hover:bg-white/50 transition-colors cursor-pointer" onClick={() => { setIsEditingName(true); setTempName(stats.petName); }}>
              <h2 className="text-2xl font-bold text-teal-900 border-b-2 border-transparent group-hover:border-teal-300 border-dashed">
                {stats.petName}
              </h2>
              <span className="text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil size={14} />
              </span>
            </div>
          )}
        </div>

        <div className="relative h-40 w-full flex justify-center items-center mb-2">
          {/* Particles */}
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
                animate={{ 
                  opacity: 0, 
                  x: p.x, 
                  y: petAction === 'happy' ? -100 - Math.random() * 50 : 50 + Math.random() * 50, // Hearts go up, crumbs go down
                  scale: petAction === 'happy' ? 1.5 : 0.8 
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute pointer-events-none"
                style={{ zIndex: 20 }}
              >
                {petAction === 'happy' ? (
                  <Heart fill="#e11d48" className="text-red-600" size={24} />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-orange" />
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence mode='wait'>
            {petAction === 'idle' && (
              <motion.div
                key="idle"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1, y: [0, -10, 0] }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="cursor-pointer select-none drop-shadow-xl"
                onClick={handlePet}
                whileHover={{ scale: 1.05 }}
              >
                <DogAvatar expression="idle" size={140} level={stats.level} />
              </motion.div>
            )}
            {petAction === 'happy' && (
              <motion.div
                key="happy"
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1.1, rotate: 10, y: [0, -15, 0] }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ y: { repeat: Infinity, duration: 0.5 } }}
                className="select-none drop-shadow-xl"
              >
                 <DogAvatar expression="happy" size={140} level={stats.level} />
              </motion.div>
            )}
            {petAction === 'eating' && (
              <motion.div
              key="eating"
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 0.3 }}
              className="select-none drop-shadow-xl"
            >
               <DogAvatar expression="eating" size={140} level={stats.level} />
            </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Card */}
      <div className="w-full bg-teal-50 rounded-2xl p-4 shadow-sm mb-4 z-10 border border-teal-100">
        <div className="flex justify-between items-end mb-2">
          <span className="text-teal-600 font-bold text-xs uppercase tracking-wider">Experience</span>
          <span className="text-teal-900 font-bold text-[10px]">{Math.floor(stats.currentExp)} / {stats.maxExp} XP</span>
        </div>
        <div className="w-full h-2.5 bg-white rounded-full overflow-hidden border border-teal-100">
          <motion.div 
            className="h-full bg-orange"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 50 }}
          />
        </div>
        
        <div className="mt-3 flex justify-between items-center bg-white p-2 rounded-xl border border-teal-100">
          <span className="text-teal-800 font-medium flex items-center gap-2 text-sm">
            <Sparkles className="text-teal-600" size={16} /> Points
          </span>
          <span className="text-xl font-bold text-teal-900">{stats.points}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 w-full z-10">
        <Button 
          variant="secondary" // Orange (Accent)
          onClick={handlePet}
          disabled={stats.points < 5}
          className={`flex flex-col py-3 px-2 h-auto ${stats.points < 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Heart size={20} className={petAction === 'happy' ? 'animate-bounce' : ''} />
          <span className="text-xs mt-1">Pet (5 pts)</span>
        </Button>
        
        <Button 
          variant="primary" // Teal (Primary)
          onClick={handleFeed}
          disabled={stats.points < 20}
          className={`flex flex-col py-3 px-2 h-auto ${stats.points < 20 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Utensils size={20} />
          <span className="text-xs mt-1">Feed (20 pts)</span>
        </Button>
      </div>
    </div>
  );
};