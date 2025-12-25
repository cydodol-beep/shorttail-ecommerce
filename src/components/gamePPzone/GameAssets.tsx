import React from 'react';

// Common Gradients & Filters
const AssetDefs = () => (
  <defs>
    {/* Fur Gradients */}
    <radialGradient id="furBase" cx="40%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#A1887F" /> 
      <stop offset="100%" stopColor="#5D4037" />
    </radialGradient>
    
    {/* Elder Grey Fur */}
    <radialGradient id="furElder" cx="40%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#E0E0E0" /> 
      <stop offset="100%" stopColor="#9E9E9E" />
    </radialGradient>

    {/* Celestial Cosmic Fur */}
    <linearGradient id="furCosmic" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#F3E5F5" />
      <stop offset="25%" stopColor="#E1BEE7" />
      <stop offset="50%" stopColor="#CE93D8" />
      <stop offset="75%" stopColor="#BA68C8" />
      <stop offset="100%" stopColor="#AB47BC" />
    </linearGradient>
    
    <radialGradient id="furLight" cx="40%" cy="30%" r="80%">
      <stop offset="0%" stopColor="#D7CCC8" />
      <stop offset="100%" stopColor="#A1887F" />
    </radialGradient>
    
    {/* Cream Markings */}
    <linearGradient id="creamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFF8E1" />
      <stop offset="100%" stopColor="#FFE0B2" />
    </linearGradient>

    {/* Glossy Eyes */}
    <radialGradient id="eyeGradient" cx="35%" cy="35%" r="60%">
      <stop offset="0%" stopColor="#555" />
      <stop offset="90%" stopColor="#000" />
    </radialGradient>

    {/* Shiny Nose */}
    <radialGradient id="noseGradient" cx="30%" cy="30%" r="60%">
      <stop offset="0%" stopColor="#8D6E63" />
      <stop offset="100%" stopColor="#2c1810" />
    </radialGradient>
    
    {/* Gold Items */}
    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFF59D" />
      <stop offset="50%" stopColor="#FBC02D" />
      <stop offset="100%" stopColor="#F57F17" />
    </linearGradient>

    {/* Celestial Wing Gradient */}
    <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#E0F7FA" stopOpacity="0.9" />
      <stop offset="100%" stopColor="#80DEEA" stopOpacity="0.6" />
    </linearGradient>

    {/* Soft Drop Shadow */}
    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
      <feOffset dx="0" dy="2" result="offsetblur" />
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3" />
      </feComponentTransfer>
      <feMerge>
        <feMergeNode />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
        </feMerge>
    </filter>
  </defs>
);

interface AssetProps {
  className?: string;
  size?: number;
}

// === THE DOG AVATAR (3D Style) ===
interface DogProps extends AssetProps {
  expression: 'idle' | 'catching' | 'hit' | 'happy' | 'eating';
  level?: number;
}

export const DogAvatar: React.FC<DogProps> = ({ expression, className, size = 100, level = 1 }) => {
  // --- EVOLUTION LOGIC ---
  let stage: 'puppy' | 'junior' | 'adult' | 'veteran' | 'elder' | 'celestial' = 'puppy';
  
  if (level >= 100) stage = 'celestial';
  else if (level >= 70) stage = 'elder';
  else if (level >= 50) stage = 'veteran';
  else if (level >= 30) stage = 'adult';
  else if (level >= 10) stage = 'junior';
  else stage = 'puppy';

  // Animation/Expression Logic
  const eyeState = expression === 'hit' ? 'X' : expression === 'happy' ? '^^' : 'open';
  const mouthState = expression === 'catching' || expression === 'eating' ? 'open' : expression === 'happy' ? 'smile' : 'normal';

  // --- Configuration ---
  const config = {
    puppy: {
      scale: 0.70, translateY: 20, headRadius: 42,
      bodyPath: "M 35,70 Q 30,90 50,90 Q 70,90 65,70", // Chubby
      earType: 'floppy_round',
      furUrl: "url(#furBase)",
      hasCollar: false, hasScarf: false, hasGlasses: false, hasCrown: false, hasWings: false
    },
    junior: {
      scale: 0.80, translateY: 12, headRadius: 38,
      bodyPath: "M 32,68 Q 28,90 50,90 Q 72,90 68,68",
      earType: 'floppy_triangle',
      furUrl: "url(#furBase)",
      hasCollar: true, hasScarf: false, hasGlasses: false, hasCrown: false, hasWings: false
    },
    adult: {
      scale: 0.90, translateY: 5, headRadius: 36,
      bodyPath: "M 30,65 Q 25,90 50,90 Q 75,90 70,65",
      earType: 'floppy_triangle',
      furUrl: "url(#furBase)",
      hasCollar: true, hasScarf: false, hasGlasses: true, hasCrown: false, hasWings: false
    },
    veteran: {
      scale: 1.0, translateY: 0, headRadius: 34,
      bodyPath: "M 25,60 Q 20,95 50,95 Q 80,95 75,60", // Muscular
      earType: 'pointy',
      furUrl: "url(#furBase)", // Darker brown natively
      hasCollar: false, hasScarf: true, hasGlasses: true, hasCrown: false, hasWings: false
    },
    elder: {
      scale: 0.95, translateY: 2, headRadius: 35,
      bodyPath: "M 30,65 Q 25,90 50,90 Q 75,90 70,65",
      earType: 'floppy_triangle', // Back to floppy, relaxed
      furUrl: "url(#furElder)", // Grey
      hasCollar: false, hasScarf: false, hasGlasses: true, hasCrown: false,
      hasBeard: true, hasWings: false
    },
    celestial: {
      scale: 1.1, translateY: -5, headRadius: 36,
      bodyPath: "M 25,60 Q 20,95 50,95 Q 80,95 75,60",
      earType: 'pointy',
      furUrl: "url(#furCosmic)",
      hasCollar: false, hasScarf: false, hasGlasses: false, hasCrown: true,
      hasWings: true
    }
  }[stage];

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} style={{ overflow: 'visible' }}>
      <AssetDefs />

      {/* Global Group */}
      <g transform={`translate(${50 - 50 * config.scale}, ${config.translateY + (100 - 100 * config.scale)}) scale(${config.scale})`}>
        
        {/* SHADOW / AURA */}
        {stage === 'celestial' ? (
             <ellipse cx="50" cy="90" rx="45" ry="15" fill="url(#goldGradient)" opacity="0.4" filter="blur(8px)" />
        ) : (
             <ellipse cx="50" cy="95" rx="30" ry="8" fill="black" opacity="0.2" filter="blur(4px)" />
        )}

        {/* WINGS (Behind Body) */}
        {config.hasWings && (
           <g transform="translate(0, 5)" filter="url(#glow)">
              {/* Left Wing */}
              <path d="M 30,55 Q 10,40 5,20 Q 20,25 35,45" fill="url(#wingGradient)" stroke="white" strokeWidth="1" />
              <path d="M 5,20 Q -5,10 0,30 Q 10,40 30,55" fill="url(#wingGradient)" stroke="white" strokeWidth="1" opacity="0.7"/>
              {/* Right Wing */}
              <path d="M 70,55 Q 90,40 95,20 Q 80,25 65,45" fill="url(#wingGradient)" stroke="white" strokeWidth="1" />
              <path d="M 95,20 Q 105,10 100,30 Q 90,40 70,55" fill="url(#wingGradient)" stroke="white" strokeWidth="1" opacity="0.7"/>
           </g>
        )}

        {/* BODY */}
        <path d={config.bodyPath} fill={config.furUrl} stroke="none" />
        
        {/* BELLY PATCH */}
        <path d={`M 40,${stage === 'puppy' ? 70 : 65} Q 40,85 50,85 Q 60,85 60,${stage === 'puppy' ? 70 : 65}`} fill="url(#creamGradient)" opacity="0.8"/>

        {/* --- HEAD GROUP --- */}
        <g transform="translate(0, -5)">
          
          {/* EARS - Back Layer */}
          {config.earType === 'pointy' && (
             <>
               <path d="M 15,20 Q 5,50 30,50 L 35,35 Z" fill={config.furUrl} stroke={stage === 'celestial' ? '#BA68C8' : '#4E342E'} strokeWidth="1" />
               <path d="M 85,20 Q 95,50 70,50 L 65,35 Z" fill={config.furUrl} stroke={stage === 'celestial' ? '#BA68C8' : '#4E342E'} strokeWidth="1" />
             </>
          )}
          {(config.earType === 'floppy_triangle' || config.earType === 'floppy_round') && (
             <>
              <path d="M 15,30 Q 5,60 30,60 L 25,40 Z" fill={config.furUrl} stroke="#4E342E" strokeWidth="1" filter="url(#softShadow)" />
              <path d="M 85,30 Q 95,60 70,60 L 75,40 Z" fill={config.furUrl} stroke="#4E342E" strokeWidth="1" filter="url(#softShadow)" />
             </>
          )}

          {/* MAIN HEAD */}
          <circle cx="50" cy="45" r={config.headRadius} fill={config.furUrl} filter="url(#softShadow)" />
          
          {/* FACE MARKINGS */}
          <g transform={`scale(${config.headRadius / 36}) translate(${50 - 50 * (config.headRadius/36)}, ${45 - 45 * (config.headRadius/36)})`}>
            <path d="M 50,45 Q 35,45 30,60 Q 30,75 50,75 Q 70,75 70,60 Q 65,45 50,45" fill="url(#creamGradient)" opacity={stage === 'celestial' ? 0.6 : 1} />
          </g>
          
          {/* BEARD (Elder) */}
          {stage === 'elder' && (
             <path d="M 35,60 Q 50,90 65,60" fill="#EEEEEE" stroke="#BDBDBD" strokeWidth="1" />
          )}

          {/* EYES */}
          {eyeState === 'X' ? (
            <g stroke="#2c1810" strokeWidth="3" strokeLinecap="round">
              <path d="M 35,40 L 45,50 M 45,40 L 35,50" />
              <path d="M 55,40 L 65,50 M 65,40 L 55,50" />
            </g>
          ) : eyeState === '^^' ? (
            <g stroke="#2c1810" strokeWidth="3" strokeLinecap="round" fill="none">
               <path d="M 32,45 Q 40,38 48,45" />
               <path d="M 52,45 Q 60,38 68,45" />
            </g>
          ) : stage === 'celestial' ? (
            <g filter="url(#glow)">
              <circle cx="38" cy="45" r="5" fill="#E0F7FA" />
              <circle cx="38" cy="45" r="2.5" fill="#26C6DA" />
              <circle cx="62" cy="45" r="5" fill="#E0F7FA" />
              <circle cx="62" cy="45" r="2.5" fill="#26C6DA" />
            </g>
          ) : (
            <g>
              <circle cx="38" cy="45" r="5" fill="url(#eyeGradient)" />
              <circle cx="40" cy="43" r="2" fill="white" opacity="0.9" />
              <circle cx="62" cy="45" r="5" fill="url(#eyeGradient)" />
              <circle cx="64" cy="43" r="2" fill="white" opacity="0.9" />
            </g>
          )}

          {/* CELESTIAL FOREHEAD MARK */}
          {stage === 'celestial' && (
             <g filter="url(#glow)">
               <path d="M 50,32 L 53,37 L 50,42 L 47,37 Z" fill="url(#goldGradient)" />
             </g>
          )}

          {/* SUNGLASSES (Adult/Veteran) */}
          {config.hasGlasses && stage !== 'elder' && (
            <g>
                <path d="M 30,42 Q 40,42 48,46 L 52,46 Q 60,42 70,42 L 70,48 Q 60,55 52,48 L 48,48 Q 40,55 30,48 Z" fill="#333" stroke="black" />
                <line x1="28" y1="43" x2="15" y2="40" stroke="black" strokeWidth="2" />
                <line x1="72" y1="43" x2="85" y2="40" stroke="black" strokeWidth="2" />
            </g>
          )}
          {/* ELDER GLASSES (Reading glasses) */}
          {stage === 'elder' && (
             <g stroke="#D4AF37" strokeWidth="2" fill="none">
                 <circle cx="38" cy="48" r="7" fill="rgba(200,240,255,0.3)"/>
                 <circle cx="62" cy="48" r="7" fill="rgba(200,240,255,0.3)"/>
                 <line x1="45" y1="48" x2="55" y2="48" />
             </g>
          )}

          {/* SNOUT */}
          <ellipse cx="50" cy="58" rx="14" ry="10" fill="#FFF8E1" opacity={stage === 'celestial' ? 0.9 : 0.6} />
          <path d="M 44,56 Q 50,54 56,56 Q 56,60 50,62 Q 44,60 44,56" fill="url(#noseGradient)" />
          <ellipse cx="48" cy="57" rx="2" ry="1" fill="white" opacity="0.4" />

          {/* MOUTH */}
          <g transform="translate(0, 2)">
            {mouthState === 'open' ? (
              <path d="M 45,62 Q 50,70 55,62 Z" fill="#E57373" stroke="#4E342E" strokeWidth="1" />
            ) : mouthState === 'smile' ? (
               <path d="M 42,62 Q 50,68 58,62" fill="none" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M 47,62 Q 50,64 53,62" fill="none" stroke="#4E342E" strokeWidth="2" strokeLinecap="round" />
            )}
          </g>
          
          {/* BLUSH */}
          {(expression === 'happy' || expression === 'eating') && (
             <>
               <circle cx="28" cy="55" r="4" fill="#FF8A80" opacity="0.4" filter="blur(2px)" />
               <circle cx="72" cy="55" r="4" fill="#FF8A80" opacity="0.4" filter="blur(2px)" />
             </>
          )}

          {/* ACCESSORIES */}
          
          {config.hasCollar && (
             <path d="M 30,75 Q 50,85 70,75" fill="none" stroke={stage === 'adult' ? "#1976D2" : "#D32F2F"} strokeWidth="4" strokeLinecap="round" />
          )}

          {config.hasScarf && (
            <path d="M 30,75 Q 50,85 70,75 L 65,85 Q 50,95 35,85 Z" fill="#FF5722" />
          )}

          {config.hasCrown && (
            <g transform="translate(30, -5) scale(1.1)">
                <path d="M 0,20 L 10,0 L 20,20 L 30,0 L 40,20 Z" fill="url(#goldGradient)" stroke="#F57F17" filter="url(#glow)" />
                <circle cx="10" cy="0" r="2" fill="white" filter="url(#glow)" />
                <circle cx="30" cy="0" r="2" fill="white" filter="url(#glow)" />
            </g>
          )}

        </g>

        {/* PAWS */}
        <ellipse cx="35" cy="85" rx="8" ry="7" fill="url(#creamGradient)" stroke="#A1887F" strokeWidth="0.5" />
        <ellipse cx="65" cy="85" rx="8" ry="7" fill="url(#creamGradient)" stroke="#A1887F" strokeWidth="0.5" />
        <circle cx="35" cy="84" r="3" fill="#D7CCC8" opacity="0.5" />
        <circle cx="65" cy="84" r="3" fill="#D7CCC8" opacity="0.5" />

      </g>
    </svg>
  );
};

export const TreatBone: React.FC<{ isGolden?: boolean } & AssetProps> = ({ isGolden, className, size = 60 }) => {
  const fill = isGolden ? "url(#goldGradient)" : "#FFF";
  const stroke = isGolden ? "#F57F17" : "#E0E0E0";
  return (
    <svg width={size} height={size} viewBox="0 0 100 60" className={className} style={{overflow: 'visible'}}>
      <AssetDefs />
      {isGolden && <circle cx="50" cy="30" r="35" fill="url(#goldGradient)" filter="blur(15px)" opacity="0.4" />}
      <g filter="url(#softShadow)">
        <path d="M 25,20 Q 15,10 10,20 Q 5,30 15,40 L 25,35 L 75,35 L 85,40 Q 95,30 90,20 Q 85,10 75,20 L 25,20" fill={fill} stroke={stroke} strokeWidth="2" />
        <circle cx="15" cy="20" r="10" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="15" cy="40" r="10" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="85" cy="20" r="10" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="85" cy="40" r="10" fill={fill} stroke={stroke} strokeWidth="1" />
        <rect x="20" y="20" width="60" height="20" fill={fill} />
      </g>
    </svg>
  );
};

export const ToyBall: React.FC<AssetProps> = ({ className, size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
    <AssetDefs />
    <circle cx="30" cy="30" r="28" fill="#C6FF00" filter="url(#softShadow)" />
    <path d="M 12,12 Q 30,30 48,12" fill="none" stroke="white" strokeWidth="4" opacity="0.8" />
    <path d="M 12,48 Q 30,30 48,48" fill="none" stroke="white" strokeWidth="4" opacity="0.8" />
    <circle cx="30" cy="30" r="28" fill="url(#furBase)" opacity="0.1" /> 
  </svg>
);

export const HazardPoop: React.FC<AssetProps> = ({ className, size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" className={className}>
    <defs>
       <radialGradient id="poopGradient" cx="30%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#8D6E63" />
          <stop offset="100%" stopColor="#3E2723" />
       </radialGradient>
    </defs>
    <AssetDefs />
    <g filter="url(#softShadow)">
        <path d="M 10,50 Q 5,50 5,40 Q 5,30 15,30 Q 20,30 30,30 Q 40,30 45,30 Q 55,30 55,40 Q 55,50 50,50 Z" fill="url(#poopGradient)" />
        <path d="M 15,35 Q 12,35 12,28 Q 12,20 20,20 Q 30,20 40,20 Q 48,20 48,28 Q 48,35 45,35 Z" fill="url(#poopGradient)" />
        <path d="M 22,20 Q 20,20 20,15 Q 20,5 30,5 Q 40,5 40,15 Q 40,20 38,20 Z" fill="url(#poopGradient)" />
    </g>
    <circle cx="22" cy="30" r="3" fill="white" />
    <circle cx="22" cy="30" r="1" fill="black" />
    <circle cx="38" cy="30" r="3" fill="white" />
    <circle cx="38" cy="30" r="1" fill="black" />
    <path d="M 18,25 L 25,28" stroke="black" strokeWidth="1" />
    <path d="M 42,25 L 35,28" stroke="black" strokeWidth="1" />
  </svg>
);