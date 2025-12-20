'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import GameApp from '@/components/game/App';
import Leaderboard from '@/components/game/Leaderboard';
import GameDescription from '@/components/game/GameDescription';
import { GameRelatedProducts } from '@/components/game/GameRelatedProducts';

export default function GamePage() {
  const { loadUserProfile } = useGameStore();
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is authenticated on the client side and load their profile
  useEffect(() => {
    const checkAuthAndLoadProfile = async () => {
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
          // Load user profile from the database
          await loadUserProfile();
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        redirect('/login');
      }
    };

    checkAuthAndLoadProfile();
  }, [loadUserProfile]);

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-[#3D2C1E] dark:text-[#E6D5B8]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-[#E6D5B8]">
      {/* Game Description at the top */}
      <div className="p-4">
        <GameDescription />
      </div>

      {/* Main game area with leaderboard */}
      <div className="w-full max-w-full h-[60vh] sm:h-[70vh] min-h-[500px] max-h-[800px] bg-[#E6D5B8] border-4 border-[#634832] shadow-lg mb-6 rounded-2xl flex flex-col md:flex-row">
        <div className="w-full md:w-2/3 h-full flex flex-col border-b-4 md:border-b-0 md:border-r-4 border-[#634832]">
          <div className="h-full flex-1 overflow-hidden">
            <GameApp />
          </div>
        </div>

        {/* Leaderboard Section - Right Column (Stacked on mobile) */}
        <div className="w-full md:w-1/3 h-40 md:h-full flex flex-col">
          <div className="h-full overflow-y-auto">
            <Leaderboard />
          </div>
        </div>
      </div>

      {/* Related Products Section at the bottom */}
      <div className="p-4">
        <div className="bg-white/80 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-4 sm:p-6 shadow-lg">
          <GameRelatedProducts title="Pet Supplies & Toys" limit={4} />
        </div>
      </div>
    </div>
  );
}