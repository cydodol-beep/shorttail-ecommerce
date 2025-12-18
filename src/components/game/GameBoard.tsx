import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { DOG_BREEDS, GAME_CONFIG, COLORS } from '@/constants/game-constants';
import { Obstacle, Treat, Particle } from '@/types/game-types';
import { updateUserProfile } from '@/lib/supabase';
import { Bone, Skull, Pause, Play, RotateCcw, Home, Sparkles } from 'lucide-react';
import { GameButton as Button } from '@/components/game/GameButton';

// Helper to interpolate colors
const lerpColor = (a: string, b: string, amount: number) => {
    const ah = parseInt(a.replace(/#/g, ''), 16),
          ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff,
          bh = parseInt(b.replace(/#/g, ''), 16),
          br = bh >> 16, bg = bh >> 8 & 0xff, bb = bh & 0xff,
          rr = ar + amount * (br - ar),
          rg = ag + amount * (bg - ag),
          rb = ab + amount * (bb - ab);
    return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
};

// Helper to darken a hex color for shadows/back limbs
const darkenColor = (color: string, percent: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
};

// SVG Path Data
const DOG_PATHS = {
    golden: {
        body: "M-32,-12 Q-20,-22 5,-22 L15,-22 C35,-22 35,2 20,8 L-5,8 Q-15,20 -28,12 C-35,8 -38,-5 -32,-12 Z",
        head: "M-10,-5 C-15,-5 -22,-15 -18,-25 C-14,-32 5,-32 15,-28 C25,-22 25,-5 15,-2 C8,2 -5,2 -10,-5 Z",
        leg:  "M-5,0 C-8,5 -8,20 -2,25 L4,25 C8,20 8,5 5,0 Z",
        tail: "M0,0 Q-15,5 -25,0 Q-40,-5 -35,-15 C-30,-20 -20,-10 -5,-5 L0,0 Z",
        ear:  "M0,0 C-8,5 -8,25 0,25 C5,25 8,10 5,0 Z" 
    },
    corgi: {
        body: "M-38,-10 Q-20,-18 0,-18 L20,-18 C38,-18 38,10 20,15 L-5,15 Q-20,22 -35,15 C-42,10 -45,-5 -38,-10 Z",
        head: "M-10,-2 C-15,-2 -20,-12 -15,-22 C-10,-28 10,-28 18,-22 C24,-15 22,-2 12,0 C5,2 -5,2 -10,-2 Z",
        leg:  "M-5,0 C-7,5 -6,12 -2,15 L4,15 C8,12 8,5 5,0 Z",
        tail: "M0,0 Q-5,-5 -8,0 Q-5,5 0,0 Z",
        ear:  "M0,0 L-8,-15 L5,-5 Z" 
    },
    shiba: {
        body: "M-25,-12 Q-15,-20 0,-20 L15,-20 C30,-20 30,5 15,10 L-5,10 Q-15,18 -22,12 C-28,8 -30,-5 -25,-12 Z",
        head: "M-10,-5 C-15,-5 -20,-15 -15,-25 C-10,-30 10,-30 18,-25 C24,-18 22,-5 12,-2 C5,2 -5,2 -10,-5 Z",
        leg:  "M-4,0 C-6,5 -6,18 -2,22 L4,22 C8,18 8,5 4,0 Z",
        tail: "M0,0 C-10,-10 -5,-25 5,-20 C10,-15 5,-5 0,0 Z",
        ear:  "M0,0 L-5,-10 L5,-5 Z" 
    }
};

const DAY_DURATION = 3000;
const SKY_COLORS = {
    day: { top: '#E6D5B8', bottom: '#F4EBD9' },
    dusk: { top: '#C08261', bottom: '#E69F77' },
    night: { top: '#1F150F', bottom: '#3D2C1E' }
};

// --- Framer Motion Dog Component ---
const DogSprite: React.FC<{ 
    breed: keyof typeof DOG_PATHS, 
    animState: 'IDLE' | 'RUN' | 'JUMP' | 'DEAD' 
}> = ({ breed, animState }) => {
    const stats = DOG_BREEDS[breed];
    const paths = DOG_PATHS[breed];
    const primary = stats.color;
    const secondary = darkenColor(primary, 30);
    const accent = '#F4EBD9';

    // Animation Variants
    const bodyVariants = {
        RUN: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 0.3, ease: "linear" as const } },
        IDLE: { y: [0, 1, 0], transition: { repeat: Infinity, duration: 2.0, ease: "easeInOut" as const } },
        JUMP: { y: -5, rotate: -15, transition: { duration: 0.2 } },
        DEAD: { rotate: 180, y: 10, transition: { duration: 0.5 } }
    };

    const headVariants = {
        RUN: { rotate: [0, 2, 0], transition: { repeat: Infinity, duration: 0.3 } },
        IDLE: { rotate: [0, -2, 0], transition: { repeat: Infinity, duration: 2.0 } },
        JUMP: { rotate: -10 },
        DEAD: { rotate: 0 }
    };

    const tailVariants = {
        RUN: { rotate: [10, -5, 10], transition: { repeat: Infinity, duration: 0.2, ease: "linear" as const } },
        IDLE: { rotate: [5, -5, 5], transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" as const } },
        JUMP: { rotate: -20 },
        DEAD: { rotate: 0 }
    };

    const legA_Variants = { // Front-Right, Back-Right (The "Far" legs visually if we alternate)
        RUN: { rotate: [25, -25, 25], transition: { repeat: Infinity, duration: 0.4, ease: "linear" as const } },
        IDLE: { rotate: 0 },
        JUMP: { rotate: 30 }, // Tucked
        DEAD: { rotate: -30 }
    };

    const legB_Variants = { // Front-Left, Back-Left
        RUN: { rotate: [-25, 25, -25], transition: { repeat: Infinity, duration: 0.4, ease: "linear" as const } },
        IDLE: { rotate: 0 },
        JUMP: { rotate: 30 },
        DEAD: { rotate: -30 }
    };

    return (
        <motion.svg 
            width="100" height="100" viewBox="-50 -50 100 100" 
            className="overflow-visible w-[80px] h-[80px]"
            animate={animState}
        >
             <motion.g variants={bodyVariants}>
                {/* Far Legs (Back & Front) - Using secondary color */}
                <motion.g variants={legB_Variants} style={{ x: -15, y: 8, originX: "0px", originY: "0px" }}>
                     <path d={paths.leg} fill={secondary} />
                </motion.g>
                <motion.g variants={legA_Variants} style={{ x: 15, y: 10, originX: "0px", originY: "0px" }}>
                     <path d={paths.leg} fill={secondary} />
                </motion.g>

                {/* Tail */}
                <motion.g variants={tailVariants} style={{ x: -25, y: -5, originX: "0px", originY: "0px" }}>
                    <path d={paths.tail} fill={primary} />
                </motion.g>

                {/* Body */}
                <path d={paths.body} fill={primary} />
                <ellipse cx="0" cy="5" rx="12" ry="6" fill={accent} /> {/* Belly */}
                
                {/* Collar */}
                <path d="M18,-5 Q13,0 18,5" fill="none" stroke="#EF4444" strokeWidth="4" />

                {/* Head */}
                <motion.g variants={headVariants} style={{ x: 18, y: -15, originX: "0px", originY: "0px" }}>
                    {/* Ear (Far) */}
                    <path d={paths.ear} fill={primary} transform="translate(-5, -20) rotate(-10)" />
                    
                    <path d={paths.head} fill={primary} />
                    <ellipse cx="12" cy="0" rx="8" ry="6" fill={accent} /> {/* Snout */}
                    <circle cx="18" cy="-2" r="3" fill="#3D2C1E" /> {/* Nose */}
                    
                    {/* Eyes */}
                    {animState === 'DEAD' ? (
                        <g stroke="#3D2C1E" strokeWidth="2">
                            <path d="M0,-10 L6,-4" />
                            <path d="M6,-10 L0,-4" />
                        </g>
                    ) : (
                        <circle cx="5" cy="-8" r="2.5" fill="#3D2C1E" />
                    )}
                </motion.g>

                {/* Near Legs (Back & Front) - Using primary color */}
                <motion.g variants={legA_Variants} style={{ x: -15, y: 8, originX: "0px", originY: "0px" }}>
                     <path d={paths.leg} fill={primary} />
                </motion.g>
                <motion.g variants={legB_Variants} style={{ x: 15, y: 10, originX: "0px", originY: "0px" }}>
                     <path d={paths.leg} fill={primary} />
                </motion.g>
             </motion.g>
        </motion.svg>
    );
};

export const GameBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Game Store
  const { 
    selectedBreed, score, addScore, status, setStatus, 
    resetGame, syncTotalPoints, combo, incrementCombo, 
    resetCombo, userProfile, newUnlock, clearNewUnlock 
  } = useGameStore();

  const breedStats = DOG_BREEDS[selectedBreed];
  const currentMultiplier = 1 + Math.floor(combo / 5);

  // Animation State for DogSprite
  const [animState, setAnimState] = useState<'IDLE' | 'RUN' | 'JUMP' | 'DEAD'>('IDLE');
  const lastAnimStateRef = useRef<'IDLE' | 'RUN' | 'JUMP' | 'DEAD'>('IDLE');

  // Game Logic State
  const gameState = useRef({
    frames: 0,
    timeOfDay: 0,
    speed: GAME_CONFIG.baseSpeed,
    dy: 0,
    playerY: 0,
    playerX: 50,
    isJumping: false,
    blinkTimer: 0,
    obstacles: [] as Obstacle[],
    treats: [] as Treat[],
    particles: [] as Particle[],
    floatingTexts: [] as { x: number, y: number, text: string, life: number, color: string, scale: number }[],
    layerOffsets: { far: 0, mid: 0, near: 0 },
    clouds: [] as { x: number, y: number, scale: number, speed: number }[],
    midGroundItems: [] as { x: number, y: number, type: number, scale: number }[], 
    nearScenery: [] as { 
        x: number, y: number, type: 'tree' | 'bush' | 'lamp', scale: number, variant: number, sway: number, flicker: number 
    }[],
  });

  // Init Audio
  useEffect(() => {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      return () => { if (audioCtxRef.current) audioCtxRef.current.close(); };
  }, []);

  // Sound Helper
  const playSynthSound = (type: 'jump' | 'collect' | 'gameover') => {
      if (!audioCtxRef.current) return;
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'jump') {
          osc.type = 'triangle'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
          gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
          osc.start(now); osc.stop(now + 0.15);
      } else if (type === 'collect') {
          osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
          gain.gain.setValueAtTime(0.05, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
          osc.start(now); osc.stop(now + 0.1);
      } else if (type === 'gameover') {
          osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
          gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5);
          osc.start(now); osc.stop(now + 0.5);
      }
  };

  // Status Effects
  useEffect(() => {
    if (status === 'GAME_OVER') {
      playSynthSound('gameover');
      syncTotalPoints(score);
      updateUserProfile({ ...userProfile, total_points: userProfile.total_points + score }).catch(console.error);
    }
  }, [status]);

  useEffect(() => {
    if (newUnlock) {
      const timer = setTimeout(() => clearNewUnlock(), 5000);
      return () => clearTimeout(timer);
    }
  }, [newUnlock]);

  // Main Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const initBackground = (width: number, height: number) => {
        const state = gameState.current;
        if (state.clouds.length === 0) {
            for (let i = 0; i < 6; i++) state.clouds.push({ x: Math.random() * width, y: Math.random() * (height * 0.4), scale: 0.5 + Math.random() * 0.8, speed: 0.2 + Math.random() * 0.3 });
        }
        if (state.midGroundItems.length === 0) {
            for(let i=0; i < 12; i++) state.midGroundItems.push({ x: Math.random() * width * 2, y: height - GAME_CONFIG.floorHeight + 20, type: Math.floor(Math.random() * 2), scale: 0.5 + Math.random() * 0.5 });
        }
        if (state.nearScenery.length === 0) {
            for (let i = 0; i < 8; i++) state.nearScenery.push({ x: Math.random() * width, y: height - GAME_CONFIG.floorHeight, type: Math.random() > 0.3 ? (Math.random() > 0.5 ? 'tree' : 'bush') : 'lamp', scale: 0.8 + Math.random() * 0.4, variant: Math.floor(Math.random() * 3), sway: 0, flicker: Math.random() });
        }
    };

    const resize = () => {
        if (containerRef.current && canvas) {
            canvas.width = containerRef.current.clientWidth;
            canvas.height = containerRef.current.clientHeight;
            if (!gameState.current.isJumping) gameState.current.playerY = canvas.height - GAME_CONFIG.floorHeight - 50;
            initBackground(canvas.width, canvas.height);
        }
    };
    window.addEventListener('resize', resize);
    resize();

    // Spawning Logic
    const spawnObstacle = (width: number, height: number) => {
        const typeRoll = Math.random();
        let type: Obstacle['type'] = 'cat';
        let obsHeight = 40; let obsWidth = 40;
        let yPos = height - GAME_CONFIG.floorHeight - obsHeight;
        if (typeRoll > 0.7) { type = 'mailman'; obsHeight = 60; yPos = height - GAME_CONFIG.floorHeight - obsHeight; } 
        else if (typeRoll > 0.4) { type = 'puddle'; obsHeight = 10; obsWidth = 60; yPos = height - GAME_CONFIG.floorHeight - 5; }
        gameState.current.obstacles.push({ x: width + 50, y: yPos, width: obsWidth, height: obsHeight, type, speed: gameState.current.speed });
    };

    const spawnTreat = (width: number, height: number) => {
        const isAir = Math.random() > 0.5;
        const yPos = isAir ? height - GAME_CONFIG.floorHeight - 120 : height - GAME_CONFIG.floorHeight - 40;
        gameState.current.treats.push({ x: width + 50 + (Math.random() * 200), y: yPos, width: 30, height: 30, collected: false, value: 10 });
    };

    const update = (dt: number) => {
        if (status !== 'PLAYING') return;
        const state = gameState.current;
        state.frames++;
        
        // Speed & Physics
        state.speed = GAME_CONFIG.baseSpeed + (score / 500) + (breedStats.speedStat * 0.1);
        state.dy += GAME_CONFIG.gravity;
        state.playerY += state.dy;
        
        const floorY = canvas.height - GAME_CONFIG.floorHeight - 50;
        if (state.playerY > floorY) {
            state.playerY = floorY; state.dy = 0; state.isJumping = false;
        }

        // Parallax
        state.timeOfDay = (state.frames % DAY_DURATION) / DAY_DURATION;
        state.layerOffsets.far += state.speed * 0.1;
        state.layerOffsets.mid += state.speed * 0.3;
        
        // Background updates
        state.midGroundItems.forEach(item => { if (item.x - state.layerOffsets.mid < -200) { item.x += canvas.width + 200 + Math.random() * 300; item.type = Math.floor(Math.random() * 2); } });
        state.nearScenery.forEach(s => { 
            s.x -= state.speed * 0.6; 
            if (s.x < -100) { s.x = canvas.width + Math.random() * 100; s.type = Math.random() > 0.3 ? (Math.random() > 0.5 ? 'tree' : 'bush') : 'lamp'; s.y = canvas.height - GAME_CONFIG.floorHeight; }
        });
        state.clouds.forEach(c => { c.x -= state.speed * c.speed; if (c.x < -100) { c.x = canvas.width + 100; c.y = Math.random() * (canvas.height * 0.4); } });

        // Entities
        state.obstacles.forEach(obs => obs.x -= state.speed);
        state.obstacles = state.obstacles.filter(obs => obs.x + obs.width > -100);
        state.treats.forEach(t => t.x -= state.speed);
        state.treats = state.treats.filter(t => t.x + t.width > -100);

        // Spawning
        if (state.frames % Math.floor(GAME_CONFIG.spawnRate * (5 / state.speed)) === 0) {
            if (Math.random() > 0.3) spawnObstacle(canvas.width, canvas.height);
            if (Math.random() > 0.3) spawnTreat(canvas.width, canvas.height);
        }

        // Collision
        const pRect = { x: state.playerX + 15, y: state.playerY + 20, w: 35, h: 30 };
        for (let obs of state.obstacles) {
             if (pRect.x < obs.x + obs.width && pRect.x + pRect.w > obs.x && pRect.y < obs.y + obs.height && pRect.y + pRect.h > obs.y) {
                setStatus('GAME_OVER'); resetCombo();
            }
        }
        for (let t of state.treats) {
            if (!t.collected && pRect.x < t.x + t.width && pRect.x + pRect.w > t.x && pRect.y < t.y + t.height && pRect.y + pRect.h > t.y) {
               t.collected = true; playSynthSound('collect');
               const mult = 1 + Math.floor(useGameStore.getState().combo / 5);
               addScore(t.value); incrementCombo();
               state.floatingTexts.push({ x: t.x, y: t.y, text: mult > 1 ? `+${t.value*mult} (x${mult}!)` : `+${t.value*mult}`, life: 1.0, color: mult > 1 ? '#EF4444' : '#3D2C1E', scale: mult > 1 ? 1.5 : 1.0 });
           }
       }
       state.floatingTexts.forEach(ft => { ft.y -= 1.5; ft.life -= 0.02; });
       state.floatingTexts = state.floatingTexts.filter(ft => ft.life > 0);
    };

    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const state = gameState.current;
        const width = canvas.width; const height = canvas.height;
        
        // --- Draw Background (Condensed for brevity) ---
        const time = state.timeOfDay;
        let topColor, bottomColor;
        // Simple lerp for background
        if (time < 0.25) { topColor = SKY_COLORS.day.top; bottomColor = SKY_COLORS.day.bottom; }
        else if (time < 0.5) { topColor = lerpColor(SKY_COLORS.day.top, SKY_COLORS.night.top, (time - 0.25) * 4); bottomColor = lerpColor(SKY_COLORS.dusk.bottom, SKY_COLORS.night.bottom, (time - 0.25) * 4); }
        else if (time < 0.75) { topColor = SKY_COLORS.night.top; bottomColor = SKY_COLORS.night.bottom; }
        else { topColor = lerpColor(SKY_COLORS.night.top, SKY_COLORS.day.top, (time - 0.75) * 4); bottomColor = lerpColor(SKY_COLORS.night.bottom, SKY_COLORS.day.bottom, (time - 0.75) * 4); }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, topColor); gradient.addColorStop(1, bottomColor);
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
        
        // Sun/Moon
        const cx = width / 2; const cy = height; const radius = width * 0.4;
        const sunAngle = (time * Math.PI * 2) - Math.PI/2;
        if (time < 0.55 || time > 0.95) { ctx.fillStyle = '#FFF8F0'; ctx.beginPath(); ctx.arc(cx + Math.cos(sunAngle)*radius, cy + Math.sin(sunAngle)*radius*0.8, 40, 0, Math.PI * 2); ctx.fill(); }
        if (time > 0.25 && time < 0.75) { ctx.fillStyle = '#FEF3C7'; ctx.beginPath(); ctx.arc(cx + Math.cos(sunAngle+Math.PI)*radius, cy + Math.sin(sunAngle+Math.PI)*radius*0.8, 30, 0, Math.PI * 2); ctx.fill(); }

        // Scenery Layers
        state.clouds.forEach(c => { ctx.save(); ctx.translate(c.x, c.y); ctx.scale(c.scale, c.scale); ctx.fillStyle = '#FFF8F0'; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.arc(25,-10,35,0,Math.PI*2); ctx.arc(50,0,30,0,Math.PI*2); ctx.fill(); ctx.restore(); });
        
        ctx.fillStyle = '#D4C5A9'; ctx.beginPath(); ctx.moveTo(0, height);
        for(let x=0; x<=width; x+=10) ctx.lineTo(x, height - (Math.sin((x + state.layerOffsets.far)*0.003)*80 + 250));
        ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.fill();

        ctx.fillStyle = '#A68A7C';
        state.midGroundItems.forEach(item => {
            const drawX = item.x - state.layerOffsets.mid;
            if (drawX > -100 && drawX < width + 100) {
                 ctx.save(); ctx.translate(drawX, item.y); ctx.scale(item.scale, item.scale);
                 ctx.beginPath(); ctx.arc(0, 0, 50, Math.PI, 0); ctx.fill(); ctx.restore();
            }
        });
        
        // Floor
        ctx.fillStyle = COLORS.ground; ctx.fillRect(0, height - GAME_CONFIG.floorHeight, width, GAME_CONFIG.floorHeight);
        ctx.fillStyle = '#5D4037'; ctx.fillRect(0, height - GAME_CONFIG.floorHeight, width, 10);
        
        // Near Scenery
        state.nearScenery.forEach(s => {
             ctx.save(); ctx.translate(s.x, s.y);
             if (s.type === 'tree') { ctx.fillStyle = '#8D6E63'; ctx.fillRect(0,-60*s.scale,10*s.scale,60*s.scale); ctx.fillStyle='#5D4037'; ctx.beginPath(); ctx.moveTo(-20*s.scale,-50*s.scale); ctx.lineTo(5*s.scale,-120*s.scale); ctx.lineTo(30*s.scale,-50*s.scale); ctx.fill(); }
             else if (s.type === 'bush') { ctx.fillStyle='#634832'; ctx.beginPath(); ctx.arc(0,-10*s.scale,20*s.scale,0,Math.PI*2); ctx.arc(20*s.scale,-15*s.scale,25*s.scale,0,Math.PI*2); ctx.fill(); }
             else { ctx.fillStyle='#3D2C1E'; ctx.fillRect(0,-120,5,120); ctx.fillStyle='#FCD34D'; ctx.beginPath(); ctx.arc(2.5,-125,8,0,Math.PI*2); ctx.fill(); }
             ctx.restore();
        });

        // Obstacles & Treats
        state.obstacles.forEach(obs => {
            if (obs.type === 'cat') { ctx.font = '30px Arial'; ctx.fillText('🐱', obs.x, obs.y + 35); }
            else if (obs.type === 'mailman') { ctx.font = '40px Arial'; ctx.fillText('👮', obs.x, obs.y + 50); }
            else { ctx.fillStyle = '#60A5FA'; ctx.fillRect(obs.x, obs.y, obs.width, obs.height); }
        });
        state.treats.forEach(t => { if (!t.collected) { ctx.font = '24px Arial'; ctx.fillText('🦴', t.x, t.y + 24); } });
        
        // Floating Text
        state.floatingTexts.forEach(ft => { ctx.save(); ctx.globalAlpha=ft.life; ctx.fillStyle=ft.color; ctx.font='bold 20px Quicksand'; ctx.fillText(ft.text, ft.x, ft.y); ctx.restore(); });
    };

    // Game Loop
    const loop = (time: number) => {
        const dt = time - lastTime;
        lastTime = time;
        update(dt);
        draw();
        
        // Update Player DOM Position
        if (playerRef.current) {
             const state = gameState.current;
             playerRef.current.style.transform = `translate(${state.playerX}px, ${state.playerY - 20}px)`; // -20 to offset the SVG alignment
        }

        // Determine Animation State
        let nextAnim: 'IDLE' | 'RUN' | 'JUMP' | 'DEAD' = 'IDLE';
        if (status === 'GAME_OVER') nextAnim = 'DEAD';
        else if (status === 'PLAYING') nextAnim = gameState.current.isJumping ? 'JUMP' : 'RUN';
        else nextAnim = 'IDLE';

        if (nextAnim !== lastAnimStateRef.current) {
            setAnimState(nextAnim);
            lastAnimStateRef.current = nextAnim;
        }

        animationFrameId = requestAnimationFrame(loop);
    };
    
    // Start Loop
    animationFrameId = requestAnimationFrame(loop);

    const handleJump = () => {
        if (status !== 'PLAYING') return;
        const state = gameState.current;
        if (!state.isJumping) {
            playSynthSound('jump');
            state.dy = GAME_CONFIG.jumpForce - (breedStats.jumpStat * 0.4);
            state.isJumping = true;
        }
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Space' || e.code === 'ArrowUp') handleJump();
        if (e.code === 'Escape') setStatus(status === 'PAUSED' ? 'PLAYING' : 'PAUSED');
    };
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', handleKeyDown);
        cancelAnimationFrame(animationFrameId);
    };
  }, [status, breedStats, addScore, setStatus, incrementCombo, resetCombo]);

  return (
    <div className="relative w-full h-full flex flex-col" ref={containerRef}>
      
      {/* HUD */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="flex gap-4 items-start">
            <div className="bg-white/80 backdrop-blur-sm border-4 border-[#634832] rounded-2xl p-3 shadow-lg min-w-[140px]">
                <div className="flex items-center gap-2 text-[#634832]">
                    <Bone size={20} fill="#634832" />
                    <span className="text-2xl font-black">{score}</span>
                </div>
                 <div className="h-5 flex items-center overflow-hidden">
                    <AnimatePresence mode="wait">
                        {combo > 0 && (
                            <motion.div 
                                key="combo-text"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm font-bold text-[#C08261] pl-8 flex items-center gap-1 w-full"
                            >
                                <span>Combo {combo}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                 </div>
            </div>
            
            <AnimatePresence mode="popLayout">
                {currentMultiplier > 1 && (
                    <motion.div 
                        initial={{ scale: 0, rotate: -45, opacity: 0 }}
                        animate={{ scale: [1.5, 1], rotate: [-10, 10, 0], opacity: 1 }}
                        exit={{ scale: 0, opacity: 0, rotate: 45 }}
                        key={currentMultiplier}
                        transition={{ type: "spring", stiffness: 400, damping: 12 }}
                        className="bg-[#EF4444] text-white border-4 border-white rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-xl z-20 relative"
                        style={{ boxShadow: '0 8px 0 rgba(185, 28, 28, 1)' }}
                    >
                        <motion.div
                           animate={{ scale: [1, 1.2, 1] }}
                           transition={{ repeat: Infinity, duration: 0.5 }}
                           className="absolute -top-1 -right-1"
                        >
                            <Sparkles size={24} className="text-yellow-300 drop-shadow-md fill-yellow-300" />
                        </motion.div>
                        
                        <span className="text-[10px] font-black uppercase tracking-wider leading-none mt-1 text-white/90">Bonus</span>
                        <div className="flex items-baseline -mt-1">
                            <span className="text-xl font-bold italic opacity-90 mr-0.5">x</span>
                            <span className="text-5xl font-black italic leading-none drop-shadow-sm">{currentMultiplier}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <div className="pointer-events-auto">
            <button 
                onClick={() => setStatus(status === 'PAUSED' ? 'PLAYING' : 'PAUSED')}
                className="bg-[#E6D5B8] p-2 rounded-xl border-2 border-[#634832] hover:bg-[#F4EBD9]"
            >
                {status === 'PAUSED' ? <Play size={24}/> : <Pause size={24} />}
            </button>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        className="w-full h-full touch-none"
        onPointerDown={() => {
            if (status === 'PLAYING') {
                const state = gameState.current;
                if (!state.isJumping) {
                    playSynthSound('jump');
                    state.dy = GAME_CONFIG.jumpForce - (breedStats.jumpStat * 0.4);
                    state.isJumping = true;
                }
            }
        }}
      />
      
      {/* Dog Player Overlay */}
      <div 
        ref={playerRef} 
        className="absolute top-0 left-0 pointer-events-none will-change-transform z-10"
      >
          <DogSprite breed={selectedBreed} animState={animState} />
      </div>

      <AnimatePresence>
        {newUnlock && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -50 }}
            className="absolute top-24 left-0 right-0 z-[60] flex justify-center pointer-events-none"
          >
             <div className="bg-[#FFF8F0] border-4 border-[#C08261] rounded-2xl p-6 shadow-2xl flex flex-col items-center animate-in zoom-in spin-in-1">
                <div className="flex items-center gap-2 mb-2">
                   <Sparkles className="text-[#E3C059] w-8 h-8 animate-pulse" />
                   <h3 className="text-2xl font-black text-[#C08261] uppercase tracking-wider">New Breed Unlocked!</h3>
                   <Sparkles className="text-[#E3C059] w-8 h-8 animate-pulse" />
                </div>
                <div className="text-6xl mb-4 bg-[#E6D5B8] rounded-full w-24 h-24 flex items-center justify-center border-4 border-[#3D2C1E]">
                   🐕
                </div>
                <div className="text-center">
                    <p className="text-xl font-bold text-[#3D2C1E]">{DOG_BREEDS[newUnlock].name}</p>
                    <p className="text-[#634832] text-sm font-semibold">{DOG_BREEDS[newUnlock].description}</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === 'GAME_OVER' && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-[#F4EBD9] rounded-3xl p-8 max-w-sm w-full border-8 border-[#C08261] shadow-2xl text-center"
                >
                    <div className="flex justify-center mb-4">
                        <Skull size={48} className="text-[#3D2C1E]" />
                    </div>
                    <h2 className="text-3xl font-black text-[#3D2C1E] mb-2">Game Over!</h2>
                    <p className="text-[#634832] mb-6 font-bold text-lg">You collected {score} treats.</p>
                    
                    <div className="space-y-3">
                        <Button 
                            onClick={() => {
                                resetGame();
                                gameState.current.obstacles = [];
                                gameState.current.treats = [];
                                gameState.current.floatingTexts = [];
                                gameState.current.playerY = 0;
                            }} 
                            size="lg" 
                            className="w-full"
                        >
                            <RotateCcw size={20} /> Try Again
                        </Button>
                        <Button 
                            variant="secondary" 
                            onClick={() => setStatus('MENU')} 
                            size="lg" 
                            className="w-full"
                        >
                            <Home size={20} /> Main Menu
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {status === 'PAUSED' && (
             <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                <h2 className="text-6xl font-black text-[#3D2C1E] tracking-wider drop-shadow-lg">PAUSED</h2>
             </div>
        )}
      </AnimatePresence>

    </div>
  );
};