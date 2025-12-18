'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import GameApp from '@/components/game/App';

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
    <div className="container mx-auto py-4 px-4 max-w-6xl">
      <div className="w-full rounded-2xl overflow-hidden flex flex-col bg-[#E6D5B8] border-4 border-[#634832] shadow-lg">
        <GameApp />
      </div>
    </div>
  );
}