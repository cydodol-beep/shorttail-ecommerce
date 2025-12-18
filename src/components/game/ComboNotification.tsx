'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

export default function ComboNotification() {
  const { combo, maxCombo } = useGameStore();
  const [showCombo, setShowCombo] = useState(false);
  const [lastCombo, setLastCombo] = useState(0);
  
  // Check for combo achievement (every 5 treats collected)
  useEffect(() => {
    if (combo > 0 && combo % 5 === 0 && combo > lastCombo) {
      setLastCombo(combo);
      setShowCombo(true);
      
      // Auto-hide after 2 seconds
      const timer = setTimeout(() => {
        setShowCombo(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    } else if (combo < lastCombo) {
      // Combo was reset
      setLastCombo(combo);
    }
  }, [combo, lastCombo]);

  if (combo < 5) return null;

  return (
    <AnimatePresence>
      {showCombo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: 1, scale: 1, y: -20 }}
          exit={{ opacity: 0, scale: 0.5, y: -40 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
          className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40"
        >
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white px-6 py-3 rounded-full shadow-lg border-2 border-yellow-600 flex items-center">
            <div className="text-xl font-bold mr-2">⭐</div>
            <div>
              <div className="font-bold text-md">Combo x{combo}!</div>
              <div className="text-xs">+{combo} bonus points</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}