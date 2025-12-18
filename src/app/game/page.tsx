'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import GameBoard from '@/components/game/GameBoard';
import CharacterSelect from '@/components/game/CharacterSelect';
import { useGameStore } from '@/store/useGameStore';

export default function GamePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const { syncGameToDatabase } = useGameStore();

  // Check if user is authenticated on the client side
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Dynamically import supabase client to avoid SSR issues
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          // Redirect to login if not authenticated
          redirect('/login');
        } else {
          setUserId(user.id);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        redirect('/login');
      }
    };

    checkAuth();
  }, []);

  // Function to handle character selection
  const openCharacterSelect = () => {
    setShowCharacterSelect(true);
  };

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-[#3D2C1E] dark:text-[#E6D5B8]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#3D2C1E] dark:text-[#E6D5B8] mb-2">Paws & Paths</h1>
          <p className="text-lg text-[#6B533D] dark:text-[#B8A090]">
            Jump over obstacles and collect treats to earn points!
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="bg-[#E6D5B8] dark:bg-[#4D3D2E] rounded-lg p-4 border-2 border-[#C08261] dark:border-[#634832]">
            <h2 className="text-xl font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">Player: {userId.substring(0, 8)}...</h2>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={openCharacterSelect}
              className="px-4 py-2 bg-[#C08261] hover:bg-[#A66A4E] text-white rounded-lg transition-colors dark:bg-[#634832] dark:hover:bg-[#5A4735]"
            >
              Choose Character
            </button>

            <button
              onClick={syncGameToDatabase}
              className="px-4 py-2 bg-[#634832] hover:bg-[#5A4735] text-white rounded-lg transition-colors dark:bg-[#C08261] dark:hover:bg-[#A66A4E]"
            >
              Sync Points
            </button>
          </div>
        </div>

        <GameBoard />

        <div className="mt-8 text-center text-[#6B533D] dark:text-[#B8A090]">
          <p>Controls: Press SPACE or UP ARROW to jump | Tap on mobile to jump</p>
          <p className="mt-2">Collect treats to increase your score and unlock new dogs!</p>
        </div>
      </div>

      <CharacterSelect
        open={showCharacterSelect}
        onOpenChange={setShowCharacterSelect}
      />
    </div>
  );
}