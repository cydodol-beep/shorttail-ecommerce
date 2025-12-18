'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import GameApp from '@/components/game/App';
import { Header } from '@/components/layout/header';

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
    <div className="min-h-screen flex flex-col bg-brown-50">
      <Header />
      <div className="container mx-auto py-2 px-2 max-w-7xl flex-1">
        <div className="w-full h-[75vh] min-h-[600px] max-h-[750px] rounded-2xl overflow-hidden flex flex-col bg-[#E6D5B8] border-4 border-[#634832] shadow-lg">
          <GameApp />
        </div>
      </div>
    </div>
  );
}