import React, { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { GameBoard } from '@/components/game/GameBoard';
import { Trophy, Dog } from 'lucide-react';

// Define the colors directly in the component to avoid import issues
const COLORS = {
  background: '#E6D5B8', // Soft Sand
  ground: '#634832',     // Dark Wood
  accent: '#C08261',     // Terra Cotta
  text: '#3D2C1E',       // Deep Espresso
  cream: '#F4EBD9',      // Cream
  success: '#4ADE80',
  danger: '#EF4444',
};

const GameApp: React.FC = () => {
  const { status, userProfile } = useGameStore();

  // Prevent default touch behaviors (zooming/scrolling) for better game experience
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.body.addEventListener('touchmove', preventDefault, { passive: false });
    return () => document.body.removeEventListener('touchmove', preventDefault);
  }, []);

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-[#E6D5B8]">

      {/* Conditional Header - Only show in Menu */}
      {status === 'MENU' && (
        <header className="p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-[#C08261] p-2 rounded-lg text-white">
                    <Dog size={24} />
                </div>
                <h1 className="text-2xl font-black tracking-tight" style={{ color: COLORS.text }}>Paws & Paths</h1>
            </div>

            <div className="flex items-center gap-4 bg-white/50 px-4 py-2 rounded-full border border-[#C08261]/30">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[#C08261]" />
                    <span className="font-bold text-[#3D2C1E]">{userProfile.total_points} Lifetime Pts</span>
                </div>
            </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {status === 'MENU' ? (
          <CharacterSelect />
        ) : (
          <GameBoard />
        )}
      </main>

      {/* Footer / Instructions (Menu Only) */}
      {status === 'MENU' && (
        <footer className="p-4 text-center text-[#3D2C1E]/60 text-sm">
            <p>Use <strong>Arrow Up</strong> or <strong>Space</strong> to jump.</p>
        </footer>
      )}
    </div>
  );
};

export default GameApp;