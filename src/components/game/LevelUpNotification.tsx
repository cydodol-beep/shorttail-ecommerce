'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

export default function LevelUpNotification() {
  const { level, score } = useGameStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastLevel, setLastLevel] = useState(level);
  
  // Check for level up
  useEffect(() => {
    if (level > lastLevel) {
      setLastLevel(level);
      setShowLevelUp(true);
      
      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowLevelUp(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [level, lastLevel, score]);

  return (
    <AnimatePresence>
      {showLevelUp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -50 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
        >
          <div className="bg-gradient-to-r from-[#C08261] to-[#A66A4E] text-white px-6 py-4 rounded-full shadow-lg border-4 border-[#634832] flex items-center">
            <div className="text-2xl font-bold mr-3">🎉</div>
            <div>
              <div className="font-bold text-lg">Level Up!</div>
              <div className="text-sm">You reached level {level}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}