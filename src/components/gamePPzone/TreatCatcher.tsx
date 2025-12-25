import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, useVelocity } from 'framer-motion';
import { Play, RotateCcw, Gauge, Cloud, Target, XCircle, Moon, Volume2, VolumeX, Bone, Sun, Keyboard as KeyboardIcon, Music, Trees, Waves, Building2, Rocket, Star as StarIcon, Bird } from 'lucide-react';
import { useGameStore } from '@/store/gamePPzone/useGameStore';
import { GameItem } from '@/types/gamePPzone/types';
import { Button } from './ui/Button';
import { playSound, startMusic, stopMusic, setMusicIntensity, toggleMute, getMuteState, initAudio } from '@/lib/gamePPzone/sound';
import { DogAvatar, TreatBone, ToyBall, HazardPoop } from './GameAssets';

const DOG_SIZE = 12; // Percentage width
const KEYBOARD_SPEED = 1.5; // Speed % per frame

interface GameSessionStats {
  bonesCaught: number;
  poopAvoided: number;
  itemsMissed: number;
  accuracy: number;
}

interface AmbientEffect {
  id: number;
  type: 'bird' | 'star' | 'satellite';
  x?: number; // Start X %
  y?: number; // Start Y %
  scale: number;
  duration: number;
}

interface FloatingText {
  id: number;
  text: string;
  color: string;
}

type BiomeType = 'backyard' | 'forest' | 'beach' | 'city' | 'sky' | 'space';

// --- SCENERY COMPONENTS ---

const ForestBackground = ({ theme }: { theme: string }) => (
  <div className="absolute inset-0 w-full h-full pointer-events-none">
    <div className={`absolute bottom-20 left-0 w-full flex justify-around opacity-${theme === 'night' ? '30' : '40'} text-teal-900`}>
       <Trees size={120} strokeWidth={1} className="transform -translate-x-10 scale-150" />
       <Trees size={90} strokeWidth={1} className="transform translate-x-20 scale-125" />
       <Trees size={140} strokeWidth={1} className="transform -translate-x-32 scale-110" />
    </div>
    <div className={`absolute bottom-16 -right-10 opacity-${theme === 'night' ? '50' : '60'} text-teal-800`}>
       <Trees size={180} strokeWidth={1.5} />
    </div>
    <div className={`absolute bottom-16 -left-10 opacity-${theme === 'night' ? '50' : '60'} text-teal-800`}>
       <Trees size={150} strokeWidth={1.5} />
    </div>
  </div>
);

const BeachBackground = ({ theme }: { theme: string }) => (
  <div className="absolute inset-0 w-full h-full pointer-events-none">
    <div className={`absolute bottom-24 w-full h-24 bg-teal-600 opacity-60 rounded-t-[50%] scale-x-150 transform transition-colors duration-1000 ${theme === 'sunset' ? 'bg-orange-700' : ''}`} />
    <div className="absolute bottom-10 left-0 w-full flex justify-around text-teal-200/50">
       <Waves size={64} /><Waves size={64} className="translate-y-4" /><Waves size={64} /><Waves size={64} className="translate-y-4" />
    </div>
    <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-light/40 rounded-full blur-xl transform translate-y-10 translate-x-10" />
    <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-light/40 rounded-full blur-xl transform translate-y-10 -translate-x-10" />
  </div>
);

const CityBackground = ({ theme }: { theme: string }) => (
    <div className="absolute inset-0 w-full h-full pointer-events-none flex items-end justify-center">
        {/* Far buildings */}
        <div className={`w-full flex items-end justify-around space-x-1 mb-16 opacity-${theme === 'night' ? '40' : '20'}`}>
            <div className="w-16 h-48 bg-purple-900/50 rounded-t-lg"></div>
            <div className="w-12 h-32 bg-purple-900/50 rounded-t-lg"></div>
            <div className="w-20 h-64 bg-purple-900/50 rounded-t-lg"></div>
             <div className="w-16 h-40 bg-purple-900/50 rounded-t-lg"></div>
        </div>
        {/* Near buildings */}
         <div className={`absolute bottom-12 w-full flex items-end justify-center space-x-4 opacity-${theme === 'night' ? '80' : '60'} text-indigo-900`}>
             <Building2 size={120} strokeWidth={1}/>
             <Building2 size={160} strokeWidth={1} className="transform -translate-y-4"/>
             <Building2 size={100} strokeWidth={1}/>
             <Building2 size={140} strokeWidth={1} className="transform translate-y-2"/>
         </div>
    </div>
);

const SkyBackground = () => (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 left-10 opacity-40"><Cloud size={80} fill="white" className="text-white"/></div>
        <div className="absolute top-40 right-20 opacity-30"><Cloud size={100} fill="white" className="text-white"/></div>
        <div className="absolute top-10 right-1/3 opacity-20"><Cloud size={60} fill="white" className="text-white"/></div>
        {/* Floating Islands */}
        <div className="absolute bottom-32 left-10 w-32 h-8 bg-green-100 rounded-full opacity-50 blur-sm"></div>
        <div className="absolute bottom-40 right-10 w-24 h-6 bg-green-100 rounded-full opacity-50 blur-sm"></div>
    </div>
);

const SpaceBackground = () => (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Planets */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-500 rounded-full opacity-50 blur-sm shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
        <div className="absolute bottom-40 right-10 w-12 h-12 bg-blue-400 rounded-full opacity-40 blur-sm"></div>
        {/* Stars */}
        {[...Array(20)].map((_,i) => (
            <div key={i} className="absolute bg-white rounded-full animate-pulse" 
            style={{
                top: `${Math.random()*80}%`, left: `${Math.random()*100}%`,
                width: Math.random()*3, height: Math.random()*3, opacity: Math.random()
            }}/>
        ))}
    </div>
);


export const TreatCatcher: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [items, setItems] = useState<GameItem[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isMuted, setIsMuted] = useState(getMuteState());
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  
  // Refs for Game Loop Stability
  const scoreRef = useRef(0);
  const gameEndTimeRef = useRef(0);
  const lastSecondsRemaining = useRef(30);
  const keysPressed = useRef<Set<string>>(new Set());

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  
  const [ambientEffects, setAmbientEffects] = useState<AmbientEffect[]>([]);
  const [finalStats, setFinalStats] = useState<GameSessionStats | null>(null);
  const sessionStatsRef = useRef({ caught: 0, missed: 0, poopAvoided: 0, poopHit: 0 });
  const [dogStatus, setDogStatus] = useState<'idle' | 'catching' | 'hit'>('idle');
  
  // --- Physics & Movement ---
  const dogX = useMotionValue(50);
  const smoothDogX = useSpring(dogX, { stiffness: 600, damping: 35 });
  const dogVelocity = useVelocity(smoothDogX);
  const dogRotate = useTransform(dogVelocity, [-300, 300], [-15, 15]);
  const dogXPercent = useTransform(smoothDogX, x => `${x}%`);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastSpawnTime = useRef<number>(0);
  const dogStatusTimeout = useRef<NodeJS.Timeout | null>(null);
  const poopComboRef = useRef<number>(0); 
  
  const { addPoints, stats, updateQuestProgress } = useGameStore();
  const level = stats.level;

  // --- BIOME & DIFFICULTY LOGIC (1-100 Scale) ---
  
  const getBiome = (lvl: number): BiomeType => {
    if (lvl >= 90) return 'space';
    if (lvl >= 70) return 'sky';
    if (lvl >= 50) return 'city';
    if (lvl >= 30) return 'beach';
    if (lvl >= 10) return 'forest';
    return 'backyard';
  };
  
  const biome = getBiome(level);

  const getDifficultyConfig = (level: number) => {
    if (level < 5) return { spawnRate: 1000, speedMultiplier: 1.0, trapChance: 0, label: 'Novice', color: 'bg-teal-50 border-teal-200' };
    if (level < 20) return { spawnRate: 900, speedMultiplier: 1.2, trapChance: 0.15, label: 'Rookie', color: 'bg-teal-100 border-teal-300' };
    if (level < 40) return { spawnRate: 800, speedMultiplier: 1.4, trapChance: 0.3, label: 'Pro', color: 'bg-orange-light border-orange' };
    if (level < 70) return { spawnRate: 650, speedMultiplier: 1.7, trapChance: 0.5, label: 'Elite', color: 'bg-orange text-white border-orange-hover' };
    if (level < 90) return { spawnRate: 500, speedMultiplier: 2.0, trapChance: 0.7, label: 'Master', color: 'bg-purple-600 text-white border-purple-800' };
    return { spawnRate: 400, speedMultiplier: 2.5, trapChance: 0.8, label: 'Legend', color: 'bg-black text-white border-gray-700' };
  };

  const getSceneryTheme = (time: number) => {
    if (!isPlaying) return 'day';
    if (biome === 'space') return 'night'; // Space is always night
    if (time > 20) return 'day';
    if (time > 10) return 'sunset';
    return 'night';
  };

  const currentConfig = getDifficultyConfig(level);
  const theme = getSceneryTheme(timeLeft);

  // --- Keyboard Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current.add(e.key.toLowerCase()); };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current.delete(e.key.toLowerCase()); };
    window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, []);

  // --- Ambient Effects Spawning Logic ---
  useEffect(() => {
    if (!isPlaying) { setAmbientEffects([]); return; }

    const spawnEffect = () => {
        const id = Date.now() + Math.random();
        // Space satellites
        if (biome === 'space' && Math.random() < 0.2) {
             setAmbientEffects(prev => [...prev, { id, type: 'satellite', x: Math.random() * 100, duration: 4, scale: 0.8 }]);
             return;
        }
        
        if (theme === 'day') {
             if (Math.random() < 0.3) { 
                 setAmbientEffects(prev => [...prev, { id, type: 'bird', y: 5 + Math.random() * 25, duration: 5 + Math.random() * 5, scale: 0.6 + Math.random() * 0.4 }]);
             }
        } else if (theme === 'night') {
             if (Math.random() < 0.25) {
                 setAmbientEffects(prev => [...prev, { id, type: 'star', x: 20 + Math.random() * 80, duration: 0.8 + Math.random() * 0.5, scale: 0.5 + Math.random() * 0.5 }]);
             }
        }
    };

    const interval = setInterval(spawnEffect, 1000);
    return () => clearInterval(interval);
  }, [theme, isPlaying, biome]);

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current || !isPlaying) return;
    const rect = containerRef.current.getBoundingClientRect();
    let clientX: number;
    if ('touches' in e) { if (e.touches.length > 0) clientX = e.touches[0].clientX; else return; } else { clientX = (e as React.MouseEvent).clientX; }
    let newX = ((clientX - rect.left) / rect.width) * 100;
    newX = Math.max(DOG_SIZE / 2, Math.min(100 - DOG_SIZE / 2, newX));
    dogX.set(newX);
  }, [isPlaying, dogX]);

  const handleToggleMute = () => setIsMuted(toggleMute());

  const startGame = () => {
    // Initialize audio context - this might be needed due to browser autoplay policies
    initAudio();
    playSound('click');
    setItems([]); setAmbientEffects([]); setScore(0); scoreRef.current = 0; keysPressed.current.clear();
    const duration = 30; setTimeLeft(duration); lastSecondsRemaining.current = duration;
    gameEndTimeRef.current = Date.now() + (duration * 1000);
    dogX.set(50); smoothDogX.set(50); setDogStatus('idle'); poopComboRef.current = 0;
    setFloatingTexts([]);

    // Scale intensity relative to Level 100 max
    const startIntensity = Math.min(1, level / 100);
    setMusicIntensity(startIntensity);

    sessionStatsRef.current = { caught: 0, missed: 0, poopAvoided: 0, poopHit: 0 };
    setFinalStats(null);
    setIsPlaying(true);
  };

  const endGame = useCallback(() => {
    setIsPlaying(false);
    const finalScore = scoreRef.current;
    addPoints(finalScore);
    updateQuestProgress('accumulate_score', finalScore);
    setDogStatus('idle');
    if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    playSound('levelUp'); 
    const { caught, missed, poopAvoided } = sessionStatsRef.current;
    const totalGoodItems = caught + missed;
    const accuracy = totalGoodItems > 0 ? Math.round((caught / totalGoodItems) * 100) : 0;
    setFinalStats({ bonesCaught: caught, poopAvoided: poopAvoided, itemsMissed: missed, accuracy: accuracy });
  }, [addPoints, updateQuestProgress]);

  useEffect(() => { isPlaying ? startMusic() : stopMusic(); return () => stopMusic(); }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      // Adjusted curve for Level 100
      const baseIntensity = Math.min(0.8, level / 100);
      const scoreIntensity = Math.min(0.2, score / 800);
      setMusicIntensity(baseIntensity + scoreIntensity);
    }
  }, [score, level, isPlaying]);

  const triggerDogReaction = (status: 'catching' | 'hit') => {
    setDogStatus(status);
    if (dogStatusTimeout.current !== null) clearTimeout(dogStatusTimeout.current);
    dogStatusTimeout.current = setTimeout(() => { setDogStatus('idle'); }, 500) as NodeJS.Timeout;
  };

  const gameLoop = useCallback((time: number) => {
    const now = Date.now();
    const msRemaining = gameEndTimeRef.current - now;
    if (msRemaining <= 0) { setTimeLeft(0); endGame(); return; }

    const secRemaining = Math.ceil(msRemaining / 1000);
    if (secRemaining !== lastSecondsRemaining.current) { setTimeLeft(secRemaining); lastSecondsRemaining.current = secRemaining; }

    const keys = keysPressed.current;
    if (keys.size > 0) {
      let currentX = dogX.get(); let moveAmount = 0;
      if (keys.has('arrowleft') || keys.has('a')) moveAmount -= KEYBOARD_SPEED;
      if (keys.has('arrowright') || keys.has('d')) moveAmount += KEYBOARD_SPEED;
      if (moveAmount !== 0) {
        currentX += moveAmount; currentX = Math.max(DOG_SIZE / 2, Math.min(100 - DOG_SIZE / 2, currentX));
        dogX.set(currentX);
      }
    }

    if (!lastSpawnTime.current) lastSpawnTime.current = time;
    if (time - lastSpawnTime.current > currentConfig.spawnRate) {
      const rand = Math.random();
      let type: GameItem['type'] = 'bone';
      if (rand < 0.05) type = 'golden_bone'; else if (rand < 0.15) type = 'toy'; else if (rand < 0.45) type = 'poop';   
      const xPos = Math.random() * (100 - 10) + 5;
      const itemsToAdd: GameItem[] = [{ id: Math.random().toString(36), x: xPos, y: -10, type: type, rotation: Math.random() * 360 }];
      
      if (currentConfig.trapChance > 0 && Math.random() < currentConfig.trapChance) {
        const isPrimaryGood = ['bone', 'toy', 'golden_bone'].includes(type);
        const trapType = isPrimaryGood ? 'poop' : 'bone';
        const offset = (12 + Math.random() * 10) * (Math.random() > 0.5 ? 1 : -1);
        let trapX = xPos + offset; trapX = Math.max(5, Math.min(95, trapX));
        itemsToAdd.push({ id: Math.random().toString(36) + '-trap', x: trapX, y: -15, type: trapType, rotation: Math.random() * 360 });
      }
      setItems(prev => [...prev, ...itemsToAdd]);
      lastSpawnTime.current = time;
    }

    setItems(prevItems => {
      const nextItems: GameItem[] = [];
      const currentDogX = smoothDogX.get(); 
      prevItems.forEach(item => {
        const nextY = item.y + (1.5 * currentConfig.speedMultiplier); 
        const hitDog = nextY > 80 && nextY < 95 && Math.abs(item.x - currentDogX) < (DOG_SIZE / 1.5);
        if (hitDog) {
          if (['bone', 'toy', 'golden_bone'].includes(item.type)) {
            sessionStatsRef.current.caught += 1; updateQuestProgress('catch_items', 1); poopComboRef.current = 0;
            let points = 0;
            let color = '';
            
            if (item.type === 'golden_bone') { 
                points = 50; color = 'text-orange font-extrabold'; playSound('bonus'); 
            } else if (item.type === 'bone') { 
                points = 10; color = 'text-teal-600 font-bold'; playSound('catch'); 
            } else { 
                points = 25; color = 'text-blue-500 font-bold'; playSound('catch'); 
            }
            
            setScore(s => s + points);
            const ftId = Date.now() + Math.random();
            setFloatingTexts(prev => [...prev, { id: ftId, text: `+${points}`, color }]);
            setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== ftId)), 800);
            
            triggerDogReaction('catching');
          } else {
            sessionStatsRef.current.poopHit += 1; poopComboRef.current += 1;
            const penalty = poopComboRef.current >= 3 ? 15 : 10;
            setScore(s => Math.max(0, s - penalty)); 
            
            const ftId = Date.now() + Math.random();
            setFloatingTexts(prev => [...prev, { id: ftId, text: `-${penalty}`, color: 'text-red-500 font-bold' }]);
            setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== ftId)), 800);

            triggerDogReaction('hit'); playSound('hit');
          }
          return; 
        }
        if (level >= 5 && item.y < 95 && nextY >= 95 && ['bone', 'toy', 'golden_bone'].includes(item.type)) {
             setScore(s => Math.max(0, s - 2)); playSound('miss');
        }
        if (nextY >= 110) {
          if (item.type === 'poop') sessionStatsRef.current.poopAvoided += 1; else sessionStatsRef.current.missed += 1;
        } else { nextItems.push({ ...item, y: nextY }); }
      });
      return nextItems;
    });
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [currentConfig, smoothDogX, dogX, level, updateQuestProgress, endGame]); 

  useEffect(() => { if (isPlaying) requestRef.current = requestAnimationFrame(gameLoop); return () => { if (requestRef.current !== null) cancelAnimationFrame(requestRef.current); }; }, [isPlaying, gameLoop]);

  // --- DYNAMIC STYLES ---
  const getBackgroundStyles = () => {
    switch(biome) {
        case 'space': 
            return {
                sky: "bg-black",
                celestial: "bg-purple-200 shadow-[0_0_80px_rgba(200,100,255,0.4)]",
                celestialIcon: <Rocket className="text-purple-600" size={48} />,
                groundBack: "bg-gray-900", groundFront: "bg-gray-800"
            };
        case 'sky':
             return theme === 'night' ? {
                sky: "bg-gradient-to-b from-indigo-900 to-purple-800",
                celestial: "bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]",
                celestialIcon: <Moon className="text-indigo-900" size={40} />,
                groundBack: "bg-indigo-900", groundFront: "bg-indigo-800"
             } : {
                sky: "bg-gradient-to-b from-sky-300 via-sky-200 to-white",
                celestial: "bg-yellow-100 shadow-[0_0_80px_rgba(255,255,200,0.8)]",
                celestialIcon: <Sun className="text-orange" size={64} />,
                groundBack: "bg-white/50", groundFront: "bg-white/80" // Clouds as ground
             };
        case 'city':
             return theme === 'night' ? {
                sky: "bg-gradient-to-b from-slate-900 to-purple-900",
                celestial: "bg-purple-100 shadow-[0_0_50px_rgba(200,200,255,0.3)]",
                celestialIcon: <Moon className="text-slate-900" size={40} />,
                groundBack: "bg-slate-900", groundFront: "bg-black"
             } : {
                sky: "bg-gradient-to-b from-blue-400 via-purple-300 to-orange-100",
                celestial: "bg-orange-light shadow-[0_0_60px_rgba(255,160,0,0.6)]",
                celestialIcon: <Sun className="text-orange" size={48} />,
                groundBack: "bg-gray-700", groundFront: "bg-gray-800"
             };
        case 'beach': 
             return theme === 'night' ? {
                 sky: "bg-gradient-to-b from-blue-950 via-teal-900 to-teal-800",
                 celestial: "bg-white shadow-[0_0_50px_rgba(255,255,255,0.6)]",
                 celestialIcon: <Moon className="text-teal-800" size={48} />,
                 groundBack: "bg-teal-900", groundFront: "bg-teal-800"
             } : {
                 sky: "bg-gradient-to-b from-blue-300 via-teal-100 to-orange-50",
                 celestial: "bg-yellow-100 shadow-[0_0_100px_rgba(255,200,50,0.8)]",
                 celestialIcon: <Sun className="text-orange" size={64} />,
                 groundBack: "bg-orange-light", groundFront: "bg-orange-light"
             };
        case 'forest':
             return theme === 'night' ? {
                 sky: "bg-gradient-to-b from-gray-900 via-teal-950 to-black",
                 celestial: "bg-teal-50 shadow-[0_0_40px_rgba(200,255,255,0.3)]",
                 celestialIcon: <Moon className="text-teal-900" size={40} />,
                 groundBack: "bg-black", groundFront: "bg-teal-950/50"
             } : {
                 sky: "bg-gradient-to-b from-teal-400 via-teal-100 to-cream",
                 celestial: "bg-yellow-200 shadow-[0_0_60px_rgba(255,255,200,0.6)]",
                 celestialIcon: <Sun className="text-orange" size={48} />,
                 groundBack: "bg-teal-800", groundFront: "bg-teal-700"
             };
        default: // Backyard
             return theme === 'night' ? {
                 sky: "bg-gradient-to-b from-teal-900 via-teal-800 to-teal-700",
                 celestial: "bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]",
                 celestialIcon: <Moon className="text-teal-900" size={40} />,
                 groundBack: "bg-teal-950", groundFront: "bg-black/30"
             } : {
                 sky: "bg-gradient-to-b from-teal-200 via-teal-50 to-cream",
                 celestial: "bg-orange-light shadow-[0_0_60px_rgba(255,224,178,0.8)]",
                 celestialIcon: <Sun className="text-orange" size={48} />,
                 groundBack: "bg-teal-600", groundFront: "bg-teal-500"
             };
    }
  };

  const bgStyle = getBackgroundStyles();
  
  // Custom Cloud color
  const cloudColor = (biome === 'space' || biome === 'city' && theme === 'night') ? "text-gray-600 opacity-20" : "text-white opacity-60";

  return (
    <div className="bg-cream rounded-3xl p-4 shadow-xl border-4 border-teal-700 h-[500px] flex flex-col relative overflow-hidden">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-2 z-10 bg-white/80 backdrop-blur-md p-2 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="font-bold text-teal-900 text-xl relative flex items-center">
             Score: {score}
             <AnimatePresence>
                {floatingTexts.map(ft => (
                  <motion.span
                    key={ft.id}
                    initial={{ opacity: 0, y: 10, x: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -20, x: 10, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`absolute left-full ml-2 ${ft.color} whitespace-nowrap pointer-events-none`}
                  >
                    {ft.text}
                  </motion.span>
                ))}
             </AnimatePresence>
          </div>
          <button onClick={handleToggleMute} className="p-1.5 rounded-full hover:bg-teal-50 text-teal-700 transition-colors bg-white/50 border border-teal-100 flex items-center gap-2">
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
        <div className="flex items-center gap-4">
           <span className={`text-xs px-2 py-1 rounded-full border ${currentConfig.color} font-bold flex items-center gap-1`}>
             <Gauge size={12} /> {currentConfig.label}
           </span>
           <div className={`font-bold text-xl font-mono flex items-center gap-2 ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-orange'}`}>
             {timeLeft}s
           </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 rounded-2xl relative overflow-hidden cursor-crosshair border-2 border-teal-100 group touch-none"
        onMouseMove={handleMove} onTouchMove={handleMove} onTouchStart={handleMove}>
        
        {/* === SCENERY BACKGROUND === */}
        <div className={`absolute inset-0 z-0 transition-colors duration-[2000ms] ease-in-out ${bgStyle.sky}`}></div>
        
        <AnimatePresence mode='wait'>
            {biome === 'forest' && <motion.div key="f" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0"><ForestBackground theme={theme} /></motion.div>}
            {biome === 'beach' && <motion.div key="b" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0"><BeachBackground theme={theme} /></motion.div>}
            {biome === 'city' && <motion.div key="c" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0"><CityBackground theme={theme} /></motion.div>}
            {biome === 'sky' && <motion.div key="s" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0"><SkyBackground /></motion.div>}
            {biome === 'space' && <motion.div key="sp" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="absolute inset-0"><SpaceBackground /></motion.div>}
        </AnimatePresence>
        
        <motion.div className="absolute z-0" initial={false} animate={{ top: theme === 'night' ? '15%' : '10%', right: theme === 'night' ? '15%' : '10%', scale: theme === 'sunset' ? 1.2 : 1 }} transition={{ duration: 2 }}>
           <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-1000 ${bgStyle.celestial}`}>{bgStyle.celestialIcon}</div>
        </motion.div>

        {/* Ambient Effects */}
        <AnimatePresence>
          {ambientEffects.map(effect => (
            <motion.div key={effect.id} className="absolute z-0 pointer-events-none"
                initial={effect.type === 'satellite' ? { left: '-10%', top: '20%' } : effect.type === 'star' ? { top: -10, left: `${effect.x}%`, opacity: 0 } : { left: '-10%', top: `${effect.y}%` }}
                animate={effect.type === 'star' ? { top: '70%', left: `${(effect.x||0)-30}%`, opacity: 1 } : { left: '110%' }}
                transition={{ duration: effect.duration, ease: "linear" }}
                onAnimationComplete={() => setAmbientEffects(prev => prev.filter(e => e.id !== effect.id))}
                style={{ width: 40, height: 40 }}
            >
                {effect.type === 'satellite' ? (
                     <div className="w-4 h-4 bg-gray-400 rounded-sm animate-spin opacity-80 shadow-sm border border-gray-300"></div>
                ) : effect.type === 'star' ? (
                     <div className="relative transform rotate-[45deg]">
                        <div className="absolute -top-8 left-1/2 w-0.5 h-12 bg-gradient-to-t from-white to-transparent opacity-80 blur-[0.5px]"></div>
                        <StarIcon size={14} className="text-white fill-white drop-shadow-[0_0_8px_rgba(255,255,255,1)]" />
                     </div>
                ) : (
                     <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
                        <motion.div animate={{ scaleY: [1, 0.6, 1] }} transition={{ duration: 0.25, repeat: Infinity, ease: "linear" }}>
                            <Bird size={24} className="text-teal-900 opacity-50" fill="currentColor" strokeWidth={1.5} />
                        </motion.div>
                     </motion.div>
                )}
            </motion.div>
          ))}
        </AnimatePresence>

        {biome !== 'space' && (
            <>
                <div className={`absolute top-10 left-10 z-0 animate-pulse delay-700 transition-colors duration-1000 ${cloudColor}`}><Cloud size={64} fill="currentColor" /></div>
                <div className={`absolute top-20 right-1/3 z-0 transition-colors duration-1000 ${cloudColor}`}><Cloud size={48} fill="currentColor" /></div>
            </>
        )}

        <div className={`absolute -bottom-8 -left-10 w-[120%] h-32 rounded-[100%] z-0 transition-colors duration-1000 ${bgStyle.groundBack}`}></div>
        <div className={`absolute -bottom-12 right-0 w-[120%] h-36 rounded-[100%] z-0 transition-colors duration-1000 ${bgStyle.groundFront}`}></div>

        <AnimatePresence>
          {items.map(item => (
            <motion.div key={item.id} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              style={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, transform: `translateX(-50%) rotate(${item.rotation}deg)`, zIndex: 10, width: '40px', height: '40px' }}>
              {item.type === 'bone' ? <TreatBone /> : item.type === 'golden_bone' ? <TreatBone isGolden /> : item.type === 'toy' ? <ToyBall /> : <HazardPoop />}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.div className="absolute bottom-6 z-20 origin-bottom select-none" style={{ left: dogXPercent, x: '-50%' }}>
          <motion.div style={{ rotate: dogRotate, transformOrigin: 'bottom center' }}>
             <motion.div animate={dogStatus} variants={{ idle: { y: [0, -5, 0], scale: 1, transition: { repeat: Infinity, duration: 1.5 } }, catching: { y: [0, -25, 0], scale: [1, 1.1, 1], transition: { duration: 0.4 } }, hit: { x: [0, -8, 8, -8, 8, 0], scale: 0.9, transition: { duration: 0.4 } } }} className="w-24 h-24 filter drop-shadow-lg">
                <DogAvatar expression={dogStatus} size={96} level={level} />
             </motion.div>
          </motion.div>
        </motion.div>

        {!isPlaying && (
          <div className="absolute inset-0 bg-teal-900/60 backdrop-blur-sm flex items-center justify-center z-30">
            <div className="bg-cream p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border-4 border-white">
              <h2 className="text-3xl font-bold text-teal-900 mb-4">{timeLeft === 0 ? "Game Over!" : "Ready?"}</h2>
              {timeLeft === 0 ? (
                <div className="space-y-4 mb-6">
                  <div className="bg-white p-4 rounded-2xl shadow-inner"><p className="text-teal-500 text-xs uppercase font-bold">Total Score</p><p className="text-4xl font-bold text-orange">+{score}</p></div>
                  {finalStats && (
                    <div className="grid grid-cols-2 gap-2 text-left">
                       <div className="bg-green-50 p-2 rounded-xl border border-green-100 flex items-center gap-2"><div><p className="text-[10px] text-green-700 font-bold uppercase">Caught</p><p className="text-lg font-bold text-teal-900">{finalStats.bonesCaught}</p></div></div>
                       <div className="bg-blue-50 p-2 rounded-xl border border-blue-100 flex items-center gap-2"><div><p className="text-[10px] text-blue-700 font-bold uppercase">Accuracy</p><p className="text-lg font-bold text-teal-900">{finalStats.accuracy}%</p></div></div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mb-6">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 bg-white ${currentConfig.color}`}><Gauge size={18} /><span className="font-bold uppercase">{currentConfig.label}</span></div>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Biome</span>
                    <span className="text-sm font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-100 capitalize">{biome} Zone</span>
                  </div>
                </div>
              )}
              <Button onClick={startGame} fullWidth variant="secondary">{timeLeft === 0 ? <><RotateCcw size={20} /> Play Again</> : <><Play size={20} /> Start Game</>}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};