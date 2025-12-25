'use client';

import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import GamePPZoneApp from '@/components/gamePPzone/App';
import { GameRelatedProducts } from '@/components/game/GameRelatedProducts';

export default function GamePage() {
  const [userId, setUserId] = useState<string | null>(null);

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

  if (!userId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-[#3D2C1E] dark:text-[#E6D5B8]">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto bg-[#E6D5B8]">
      {/* Game Section */}
      <div className="p-4">
        <GamePPZoneApp />
      </div>

      {/* Related Products Section */}
      <div className="p-4">
        <div className="bg-white/80 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-4 sm:p-6 shadow-lg">
          <GameRelatedProducts title="Pet Supplies & Toys" limit={4} />
        </div>
      </div>
    </div>
  );
}