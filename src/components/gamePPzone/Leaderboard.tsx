import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Trophy, Medal, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

interface LeaderboardEntry {
  pet_name: string;
  level: number;
}

export const Leaderboard: React.FC = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase
          .from('player_stats')
          .select('pet_name, level')
          .order('level', { ascending: false })
          .order('current_exp', { ascending: false })
          .limit(10);

        if (error) throw error;
        
        if (data && data.length > 0) {
            setEntries(data);
        } else {
            throw new Error("No data");
        }
      } catch (err) {
        console.log("Using mock leaderboard data (Fetch failed or table empty)");
        setEntries([
            { pet_name: 'Sir Barks-a-Lot', level: 42 },
            { pet_name: 'Princess Luna', level: 35 },
            { pet_name: 'Captain Fluff', level: 28 },
            { pet_name: 'Charlie', level: 22 },
            { pet_name: 'Max Power', level: 19 },
            { pet_name: 'Cooper', level: 15 },
            { pet_name: 'Daisy Duke', level: 12 },
            { pet_name: 'Rocky', level: 10 },
            { pet_name: 'Bear', level: 8 },
            { pet_name: 'Teddy', level: 5 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    switch (index) {
        case 0: return <Crown size={20} className="text-yellow-500 fill-yellow-500" />;
        case 1: return <Medal size={20} className="text-gray-400 fill-gray-400" />;
        case 2: return <Medal size={20} className="text-orange fill-orange" />; // Bronze mapped to Orange
        default: return <span className="font-bold text-teal-400 w-5 text-center">{index + 1}</span>;
    }
  };

  const getRowStyle = (index: number) => {
      if (index === 0) return "bg-gradient-to-r from-yellow-50 to-white border-yellow-200";
      if (index === 1) return "bg-gradient-to-r from-gray-50 to-white border-gray-200";
      if (index === 2) return "bg-gradient-to-r from-orange-light/20 to-white border-orange-light";
      return "bg-white border-teal-100 hover:bg-teal-50";
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-cream-dark relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
            <div className="bg-teal-100 p-2 rounded-xl text-teal-700">
                <Trophy size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-teal-900">Top Players</h3>
                <p className="text-teal-500 text-xs">Highest level pets</p>
            </div>
        </div>

        {/* List */}
        <div className="space-y-3">
            {loading ? (
                // Skeletons
                [...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-cream rounded-xl animate-pulse" />
                ))
            ) : (
                entries.map((entry, index) => (
                    <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-3 rounded-xl border ${getRowStyle(index)} transition-colors`}
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex items-center justify-center w-8">
                                {getRankIcon(index)}
                            </div>
                            <span className={`font-bold ${index < 3 ? 'text-teal-900' : 'text-teal-700'}`}>
                                {entry.pet_name}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                             <span className="text-xs text-teal-400 font-bold uppercase">Lvl</span>
                             <span className="bg-teal-700 text-white text-xs font-bold px-2 py-1 rounded-lg min-w-[32px] text-center">
                                {entry.level}
                             </span>
                        </div>
                    </motion.div>
                ))
            )}
        </div>
    </div>
  );
};