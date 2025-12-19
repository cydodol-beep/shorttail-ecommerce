'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trophy, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

interface LeaderboardUser {
  id: string;
  user_name: string;
  points_balance: number;
  user_avatar_url?: string;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const supabase = createClient();

        // Fetch top users with normal_user role, ordered by points in descending order
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_name, points_balance, user_avatar_url')
          .eq('role', 'normal_user') // Only normal users
          .order('points_balance', { ascending: false })
          .limit(10); // Top 10 users

        if (error) {
          throw new Error(error.message);
        }

        if (data) {
          setLeaderboard(data);
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Add current user to the leaderboard if not already in top 10
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!currentUser) return;

      try {
        const supabase = createClient();

        // Get current user's data
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_name, points_balance, user_avatar_url')
          .eq('id', currentUser.id)
          .single();

        if (error) throw new Error(error.message);

        if (data) {
          // Check if user is already in top 10
          const isTopTen = leaderboard.some(user => user.id === data.id);
          
          if (!isTopTen) {
            // Add to end of list if not in top 10
            setLeaderboard(prev => [...prev, data]);
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    };

    if (leaderboard.length > 0 && currentUser) {
      fetchCurrentUser();
    }
  }, [leaderboard, currentUser]);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-6 h-full overflow-hidden flex flex-col shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-[#3D2C1E] flex items-center gap-2">
          <Trophy className="text-[#C08261]" size={24} />
          Leaderboard
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#634832]">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-6 h-full overflow-hidden flex flex-col shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-[#3D2C1E] flex items-center gap-2">
          <Trophy className="text-[#C08261]" size={24} />
          Leaderboard
        </h2>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[#EF4444]">Error loading leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-6 h-full overflow-hidden flex flex-col shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-[#3D2C1E] flex items-center gap-2">
        <Trophy className="text-[#C08261]" size={24} />
        Leaderboard
      </h2>
      
      <div className="flex-1 overflow-y-auto space-y-3">
        {leaderboard.length === 0 ? (
          <p className="text-[#634832] text-center py-4">No users found</p>
        ) : (
          leaderboard.map((user, index) => {
            const isCurrentUser = currentUser?.id === user.id;
            const position = index + 1;
            
            return (
              <div 
                key={user.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all
                  ${isCurrentUser ? 'bg-[#C08261]/20 border-2 border-[#C08261]' : 'bg-white'}
                `}
              >
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm
                  ${position === 1 ? 'bg-yellow-500' : position === 2 ? 'bg-gray-400' : position === 3 ? 'bg-amber-700' : 'bg-[#C08261]'}
                `}>
                  {position}
                </div>
                
                <div className="w-10 h-10 rounded-full bg-[#E6D5B8] flex items-center justify-center overflow-hidden border-2 border-[#C08261]">
                  {user.user_avatar_url ? (
                    <Image
                      src={user.user_avatar_url}
                      alt={user.user_name || 'User'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized // Since we're using base64 data URLs or Supabase URLs
                    />
                  ) : (
                    <User className="text-[#634832]" size={20} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold truncate ${isCurrentUser ? 'text-[#C08261]' : 'text-[#3D2C1E]'}`}>
                    {user.user_name || 'Anonymous User'}
                  </h3>
                  <div className="flex items-center gap-1 text-sm text-[#634832]">
                    <Trophy size={14} className="text-[#C08261]" />
                    <span>{user.points_balance} pts</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}