import React, { useState, useEffect } from 'react';
import { TreatCatcher } from './TreatCatcher';
import { VirtualPet } from './VirtualPet';
import { Leaderboard } from './Leaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gamePPzone/useGameStore';
import { Star, Trophy, Calendar, Sparkles, CheckCircle2, Circle, Gift, Activity, Gamepad2, AlertTriangle, Map } from 'lucide-react';
import { playSound } from '@/lib/gamePPzone/sound';
import { DogAvatar } from './GameAssets';

const LevelUpModal = ({ level, onClose }: { level: number; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-teal-900/40 backdrop-blur-sm p-4"
  >
    <motion.div initial={{ scale: 0.5, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-[#F4EBD9] rounded-[2rem] p-8 text-center max-w-sm w-full border-8 border-[#C08261] shadow-2xl relative">
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-6xl">🎉</div>
      <h2 className="text-3xl font-bold text-[#3D2C1E] mt-4 mb-2">Level Up!</h2>
      <p className="text-[#634832] mb-6">Your pet reached Level {level}!</p>
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map((i) => <motion.div key={i} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, delay: i * 0.2 }}><Star className="text-[#C08261] fill-[#C08261]" size={32} /></motion.div>)}
      </div>
      <button onClick={onClose} className="bg-[#634832] text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:bg-[#4A3728] transition-transform active:scale-95">Awesome!</button>
    </motion.div>
  </motion.div>
);

const DailyBonusModal = ({ onClose }: { onClose: () => void }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#634832]/40 backdrop-blur-sm p-4">
    <motion.div initial={{ scale: 0.5, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} className="bg-white rounded-[2rem] p-8 text-center max-w-sm w-full border-4 border-[#634832] shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-24 bg-[#E6D5B8] rounded-b-[50%] -z-10"></div>
      <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 mt-2"><Calendar className="text-[#634832]" size={40} /></div>
      <h2 className="text-2xl font-bold text-[#3D2C1E] mb-1">Daily Bonus!</h2>
      <p className="text-[#634832] text-sm mb-6">Thanks for visiting today!</p>
      <div className="bg-[#E6D5B8] p-4 rounded-xl border border-[#C08261] mb-6 flex items-center justify-center gap-3"><Sparkles className="text-[#C08261]" size={24} /><span className="text-3xl font-bold text-[#3D2C1E]">+25 Pts</span></div>
      <button onClick={onClose} className="w-full bg-[#634832] text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:bg-[#4A3728] transition-transform active:scale-95">Collect</button>
    </motion.div>
  </motion.div>
);

const GamePPZoneApp: React.FC = () => {
  const { stats, quests, init, checkDailyBonus, checkDailyQuestsReset, claimQuestReward } = useGameStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [prevLevel, setPrevLevel] = useState(stats.level);

  useEffect(() => {
    // Initialize the game state from the database
    init();
  }, [init]);

  useEffect(() => {
    if (checkDailyBonus()) {
      setTimeout(() => {
        setShowDailyBonus(true);
        playSound('bonus');
      }, 500);
    }
    checkDailyQuestsReset();
  }, [checkDailyBonus, checkDailyQuestsReset]);

  useEffect(() => {
    if (stats.level > prevLevel) {
      setShowLevelUp(true);
      setPrevLevel(stats.level);
      playSound('levelUp');
    }
  }, [stats.level, prevLevel]);

  const handleClaim = (questId: string) => { 
    claimQuestReward(questId); 
    playSound('bonus'); 
  };

  return (
    <div className="min-h-screen bg-[#F4EBD9] font-sans text-[#3D2C1E] pb-12">
      <main className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#634832] mb-2 tracking-tight">ShortTail.id PawPlay Zone</h2>
          <p className="text-[#634832] max-w-xl mx-auto font-medium">Reach Level 100 to become a Celestial Guardian!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 order-2 lg:order-1 space-y-6 lg:sticky lg:top-8">
             <VirtualPet />

             {/* Evolution Path */}
             <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-[#634832]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#3D2C1E]">
                <span className="bg-[#E6D5B8] text-[#634832] p-1.5 rounded-lg"><Activity size={18}/></span>
                Evolution Path
              </h3>
              <div className="relative space-y-4">
                 <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#E6D5B8] -z-0"></div>
                 {[
                   { lvl: 1, name: 'Puppy', desc: 'Just getting started' },
                   { lvl: 10, name: 'Junior', desc: 'Needs a collar' },
                   { lvl: 30, name: 'Adult', desc: 'Stylish shades' },
                   { lvl: 50, name: 'Veteran', desc: 'Adventure gear' },
                   { lvl: 70, name: 'Elder', desc: 'Wise & Grey' },
                   { lvl: 100, name: 'Celestial', desc: 'Secret Ultimate Form' }
                 ].map((stage, idx) => (
                   <motion.div
                    key={stage.lvl}
                    initial={false}
                    className={`flex items-center gap-3 relative group ${stats.level >= stage.lvl ? 'opacity-100' : 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100 cursor-help'}`}
                   >
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 transition-colors duration-300 ${stats.level >= stage.lvl ? 'bg-[#C08261] border-[#C08261] text-white' : 'bg-white border-[#C08261] text-[#634832] group-hover:border-[#C08261] group-hover:text-[#C08261]'}`}>
                         <span className="text-[10px] font-bold">{stage.lvl}</span>
                      </div>
                      <div className="bg-[#F4EBD9] rounded-xl p-2 flex-1 border border-[#C08261] flex items-center gap-2 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:bg-white relative overflow-hidden">

                         {/* Locked Overlay/Preview Hint */}
                         {stats.level < stage.lvl && (
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 z-0 transition-opacity" />
                         )}

                         <div className="w-10 h-10 overflow-hidden relative z-10">
                           <DogAvatar expression="happy" level={stage.lvl} size={40} />
                         </div>
                         <div className="z-10 flex-1">
                            <div className="flex justify-between items-center">
                                <p className="text-xs font-bold text-[#3D2C1E]">{stage.name}</p>
                                {stats.level < stage.lvl && (
                                    <span className="text-[9px] font-bold text-[#C08261] opacity-0 group-hover:opacity-100 transition-opacity bg-[#C08261]/20 px-1.5 rounded">Preview</span>
                                )}
                            </div>
                            <p className="text-[10px] text-[#634832]">{stage.desc}</p>
                         </div>
                      </div>
                   </motion.div>
                 ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2 space-y-6">
            <TreatCatcher />
            <Leaderboard />
          </div>

          <div className="lg:col-span-3 order-3 space-y-6 lg:sticky lg:top-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-[#634832] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Gift size={64} className="text-[#634832]" /></div>
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#3D2C1E]"><span className="bg-[#E6D5B8] text-[#634832] p-1.5 rounded-lg"><Calendar size={18}/></span>Daily Quests</h3>
              <div className="space-y-4">
                {quests.map((quest) => (
                  <div key={quest.id} className={`rounded-xl p-3 border-2 transition-colors ${quest.completed ? (quest.claimed ? 'bg-green-50 border-green-200' : 'bg-[#C08261]/30 border-[#C08261]' ) : 'bg-[#F4EBD9] border-transparent'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className={`font-bold text-sm ${quest.completed ? (quest.claimed ? 'text-green-800' : 'text-[#3D2C1E]' ) : 'text-[#3D2C1E]'}`}>{quest.description}</p>
                        <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-bold bg-white/50 px-1.5 py-0.5 rounded text-[#634832]">+{quest.rewardPoints} Pts</span><span className="text-[10px] font-bold bg-white/50 px-1.5 py-0.5 rounded text-[#634832]">+{quest.rewardExp} XP</span></div>
                      </div>
                      <div className="ml-2">
                        {quest.claimed ? <CheckCircle2 className="text-green-600" size={24} /> : quest.completed ?
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => handleClaim(quest.id)} className="bg-[#C08261] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg hover:bg-[#A86B4C] animate-bounce">Claim!</motion.button>
                        : <Circle className="text-[#C08261]" size={24} />}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-white rounded-full overflow-hidden"><motion.div className={`h-full ${quest.completed ? (quest.claimed ? 'bg-green-500' : 'bg-[#C08261]' ) : 'bg-[#634832]'}`} initial={{ width: 0 }} animate={{ width: `${(quest.progress / quest.target) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Play Card - UPDATED */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-[#634832]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#3D2C1E]">
                <span className="bg-[#E6D5B8] text-[#634832] p-1.5 rounded-lg"><Star size={18}/></span>
                How to Play
              </h3>
              <div className="space-y-4">
                 <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600 mt-0.5">
                       <Gamepad2 size={16} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[#3D2C1E] leading-tight">Controls</h4>
                        <p className="text-xs text-[#634832] mt-0.5 leading-relaxed">
                          <strong>Desktop:</strong> Mouse or Arrow Keys.<br/>
                          <strong>Mobile:</strong> Touch & Slide.<br/>
                          <span className="italic text-[#C08261]">Movement smooths out based on speed!</span>
                        </p>
                    </div>
                 </div>

                 <div className="flex items-start gap-3">
                    <div className="bg-[#C08261]/30 p-1.5 rounded-lg text-[#C08261] mt-0.5">
                       <Trophy size={16} />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-[#3D2C1E] leading-tight">Scoring</h4>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="text-xs bg-[#E6D5B8] p-1 rounded text-center border border-[#C08261]">
                                <span className="block text-[#634832] text-[10px] uppercase font-bold">Bone</span>
                                <span className="font-bold text-[#3D2C1E]">+10</span>
                            </div>
                            <div className="text-xs bg-[#E6D5B8] p-1 rounded text-center border border-[#C08261]">
                                <span className="block text-[#634832] text-[10px] uppercase font-bold">Toy</span>
                                <span className="font-bold text-[#3D2C1E]">+25</span>
                            </div>
                             <div className="col-span-2 text-xs bg-[#C08261]/20 p-1 rounded text-center border border-[#C08261]/50">
                                <span className="block text-[#C08261] text-[10px] uppercase font-bold">Golden Bone</span>
                                <span className="font-bold text-[#A86B4C]">+50 & Bonus Sound!</span>
                            </div>
                        </div>
                    </div>
                 </div>

                 <div className="flex items-start gap-3">
                    <div className="bg-red-50 p-1.5 rounded-lg text-red-500 mt-0.5">
                       <AlertTriangle size={16} />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-[#3D2C1E] leading-tight">Hazards & Difficulty</h4>
                        <ul className="text-xs text-[#634832] mt-0.5 space-y-1 list-disc list-inside">
                           <li>Avoid <span className="font-bold text-red-600">Poop (-10)</span>. Hitting 3+ in a row triggers a combo penalty (-15)!</li>
                           <li>Higher levels = Faster drops & new Biomes.</li>
                           <li><span className="text-[#A86B4C] font-bold">Pro Tip:</span> Missing treats costs points at Lvl 5+!</li>
                        </ul>
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border-4 border-[#634832]">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#3D2C1E]"><span className="bg-[#E6D5B8] text-[#634832] p-1.5 rounded-lg"><Map size={18}/></span>Biomes</h3>
              <div className="space-y-2">
                 {[
                    { l: 10, t: 'Forest', c: 'bg-green-100 text-green-800' },
                    { l: 30, t: 'Beach', c: 'bg-yellow-100 text-yellow-800' },
                    { l: 50, t: 'City', c: 'bg-purple-100 text-purple-800' },
                    { l: 70, t: 'Sky', c: 'bg-sky-100 text-sky-800' },
                    { l: 90, t: 'Space', c: 'bg-gray-800 text-white' }
                 ].map(b => (
                    <div key={b.l} className="flex justify-between items-center text-xs">
                        <span className="text-[#634832]">Lvl {b.l}</span>
                        <span className={`font-bold px-2 py-0.5 rounded ${b.c}`}>{b.t}</span>
                    </div>
                 ))}
              </div>
            </div>

             <div className="bg-[#C08261]/10 p-6 rounded-3xl shadow-sm border-4 border-[#C08261]/20">
              <h3 className="font-bold text-lg mb-2 text-[#C08261] flex items-center gap-2"><span className="bg-white text-[#C08261] p-1.5 rounded-lg"><Trophy size={18}/></span>Goal</h3>
              <p className="text-[#3D2C1E] text-sm">Reach <span className="font-bold">Level 100</span> to max out your pet and unlock the secret "Celestial" form!</p>
            </div>
          </div>

        </div>
      </main>
      <AnimatePresence>
        {showLevelUp && <LevelUpModal level={stats.level} onClose={() => setShowLevelUp(false)} />}
        {showDailyBonus && <DailyBonusModal onClose={() => setShowDailyBonus(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default GamePPZoneApp;