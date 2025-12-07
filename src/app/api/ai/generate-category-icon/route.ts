import { NextResponse } from 'next/server';

// Keyword to Iconify icon mapping with colors
// Uses icons from: Material Design, Fluent, Noto, Twemoji, OpenMoji, etc.
const iconMapping: Record<string, { icon: string; color: string; bgColor: string }> = {
  // Dogs
  dog: { icon: 'noto:dog-face', color: '#8B4513', bgColor: '#FFF8DC' },
  puppy: { icon: 'noto:dog', color: '#D2691E', bgColor: '#FFEFD5' },
  'dog food': { icon: 'noto:bone', color: '#CD853F', bgColor: '#FFF8DC' },
  'dog toys': { icon: 'noto:tennis', color: '#9ACD32', bgColor: '#F0FFF0' },
  'dog treats': { icon: 'noto:meat-on-bone', color: '#CD5C5C', bgColor: '#FFF0F5' },
  
  // Cats
  cat: { icon: 'noto:cat-face', color: '#FF8C00', bgColor: '#FFF5EE' },
  kitten: { icon: 'noto:cat', color: '#FF6347', bgColor: '#FFF0F5' },
  'cat food': { icon: 'noto:fish', color: '#4682B4', bgColor: '#F0F8FF' },
  'cat toys': { icon: 'noto:yarn', color: '#DC143C', bgColor: '#FFF0F5' },
  'cat litter': { icon: 'mdi:bucket', color: '#808080', bgColor: '#F5F5F5' },
  
  // Birds
  bird: { icon: 'noto:bird', color: '#4169E1', bgColor: '#F0F8FF' },
  parrot: { icon: 'noto:parrot', color: '#32CD32', bgColor: '#F0FFF0' },
  'bird food': { icon: 'noto:sheaf-of-rice', color: '#DAA520', bgColor: '#FFFACD' },
  'bird cage': { icon: 'mdi:bird-home', color: '#B8860B', bgColor: '#FFF8DC' },
  
  // Fish
  fish: { icon: 'noto:tropical-fish', color: '#FF7F50', bgColor: '#E0FFFF' },
  aquarium: { icon: 'noto:fish', color: '#00CED1', bgColor: '#E0FFFF' },
  'fish food': { icon: 'noto:shrimp', color: '#FF6B6B', bgColor: '#FFF5EE' },
  
  // Small pets
  hamster: { icon: 'noto:hamster', color: '#DEB887', bgColor: '#FFF8DC' },
  rabbit: { icon: 'noto:rabbit-face', color: '#FFB6C1', bgColor: '#FFF0F5' },
  bunny: { icon: 'noto:rabbit', color: '#F5DEB3', bgColor: '#FFFAF0' },
  guinea: { icon: 'fluent-emoji:hamster', color: '#CD853F', bgColor: '#FFEFD5' },
  turtle: { icon: 'noto:turtle', color: '#2E8B57', bgColor: '#F0FFF0' },
  reptile: { icon: 'noto:lizard', color: '#6B8E23', bgColor: '#F0FFF0' },
  snake: { icon: 'noto:snake', color: '#556B2F', bgColor: '#F5F5DC' },
  
  // Food categories
  food: { icon: 'noto:pet-bowl', color: '#FF6347', bgColor: '#FFF5EE' },
  treats: { icon: 'noto:bone', color: '#CD853F', bgColor: '#FFF8DC' },
  snacks: { icon: 'noto:cookie', color: '#D2691E', bgColor: '#FFEFD5' },
  vitamins: { icon: 'mdi:pill', color: '#32CD32', bgColor: '#F0FFF0' },
  supplements: { icon: 'mdi:bottle-tonic-plus', color: '#20B2AA', bgColor: '#F0FFFF' },
  
  // Toys
  toys: { icon: 'noto:teddy-bear', color: '#9370DB', bgColor: '#F8F8FF' },
  balls: { icon: 'noto:tennis', color: '#32CD32', bgColor: '#F0FFF0' },
  chew: { icon: 'mdi:dog-service', color: '#CD853F', bgColor: '#FFF8DC' },
  
  // Accessories
  accessories: { icon: 'noto:ribbon', color: '#FF69B4', bgColor: '#FFF0F5' },
  collar: { icon: 'mdi:dog-collar', color: '#DC143C', bgColor: '#FFF0F5' },
  leash: { icon: 'mdi:leash', color: '#2F4F4F', bgColor: '#F5F5F5' },
  harness: { icon: 'mdi:dog-harness', color: '#4682B4', bgColor: '#F0F8FF' },
  tag: { icon: 'mdi:tag-heart', color: '#FF69B4', bgColor: '#FFF0F5' },
  
  // Clothing
  clothing: { icon: 'noto:t-shirt', color: '#FF69B4', bgColor: '#FFF0F5' },
  apparel: { icon: 'mdi:tshirt-crew', color: '#DA70D6', bgColor: '#FFF0F5' },
  costume: { icon: 'noto:crown', color: '#FFD700', bgColor: '#FFFACD' },
  sweater: { icon: 'mdi:hanger', color: '#87CEEB', bgColor: '#F0FFFF' },
  
  // Grooming
  grooming: { icon: 'noto:sparkles', color: '#FFD700', bgColor: '#FFFACD' },
  shampoo: { icon: 'mdi:bottle-tonic', color: '#87CEEB', bgColor: '#F0FFFF' },
  brush: { icon: 'mdi:brush', color: '#DDA0DD', bgColor: '#FFF0F5' },
  nail: { icon: 'mdi:content-cut', color: '#FF69B4', bgColor: '#FFF0F5' },
  bath: { icon: 'noto:bathtub', color: '#87CEEB', bgColor: '#F0FFFF' },
  
  // Health
  health: { icon: 'noto:red-heart', color: '#FF4500', bgColor: '#FFF5EE' },
  medicine: { icon: 'mdi:medical-bag', color: '#FF4500', bgColor: '#FFF5EE' },
  dental: { icon: 'noto:tooth', color: '#FFFFFF', bgColor: '#E0FFFF' },
  flea: { icon: 'mdi:bug', color: '#8B0000', bgColor: '#FFE4E1' },
  tick: { icon: 'mdi:shield-bug', color: '#B22222', bgColor: '#FFE4E1' },
  
  // Home
  beds: { icon: 'mdi:bed', color: '#8B4513', bgColor: '#FFF8DC' },
  cages: { icon: 'mdi:home', color: '#A0522D', bgColor: '#FAEBD7' },
  carriers: { icon: 'mdi:bag-carry-on', color: '#4682B4', bgColor: '#F0F8FF' },
  house: { icon: 'noto:house', color: '#CD853F', bgColor: '#FFEFD5' },
  kennel: { icon: 'mdi:dog-side', color: '#8B4513', bgColor: '#FFF8DC' },
  
  // Feeding
  bowls: { icon: 'mdi:bowl', color: '#4169E1', bgColor: '#F0F8FF' },
  feeders: { icon: 'mdi:food-bowl', color: '#CD853F', bgColor: '#FFEFD5' },
  water: { icon: 'noto:droplet', color: '#4169E1', bgColor: '#F0F8FF' },
  fountain: { icon: 'mdi:fountain', color: '#00CED1', bgColor: '#E0FFFF' },
  
  // Training
  training: { icon: 'noto:graduation-cap', color: '#4B0082', bgColor: '#E6E6FA' },
  clicker: { icon: 'mdi:gesture-tap', color: '#FF6347', bgColor: '#FFF5EE' },
  whistle: { icon: 'mdi:whistle', color: '#4682B4', bgColor: '#F0F8FF' },
  
  // Outdoor
  outdoor: { icon: 'noto:evergreen-tree', color: '#228B22', bgColor: '#F0FFF0' },
  travel: { icon: 'noto:airplane', color: '#4682B4', bgColor: '#F0F8FF' },
  car: { icon: 'noto:automobile', color: '#4169E1', bgColor: '#F0F8FF' },
  
  // Cleaning
  cleaning: { icon: 'noto:broom', color: '#3CB371', bgColor: '#F0FFF0' },
  waste: { icon: 'mdi:trash-can', color: '#808080', bgColor: '#F5F5F5' },
  poop: { icon: 'noto:pile-of-poo', color: '#8B4513', bgColor: '#FFF8DC' },
  
  // Fragrance & Aromatherapy
  perfume: { icon: 'mdi:spray', color: '#DA70D6', bgColor: '#FFF0F5' },
  fragrance: { icon: 'mdi:spray-bottle', color: '#DDA0DD', bgColor: '#FFF5EE' },
  cologne: { icon: 'mdi:bottle-wine', color: '#9370DB', bgColor: '#E6E6FA' },
  deodorant: { icon: 'mdi:spray', color: '#87CEEB', bgColor: '#F0FFFF' },
  'essential oil': { icon: 'mdi:bottle-tonic-outline', color: '#9ACD32', bgColor: '#F0FFF0' },
  essential: { icon: 'mdi:leaf', color: '#32CD32', bgColor: '#F0FFF0' },
  oil: { icon: 'mdi:oil', color: '#DAA520', bgColor: '#FFFACD' },
  aromatherapy: { icon: 'mdi:flower', color: '#FF69B4', bgColor: '#FFF0F5' },
  aroma: { icon: 'mdi:flower-tulip', color: '#DA70D6', bgColor: '#FFF5EE' },
  scent: { icon: 'mdi:scent', color: '#DDA0DD', bgColor: '#FFF0F5' },
  diffuser: { icon: 'mdi:air-humidifier', color: '#87CEEB', bgColor: '#F0FFFF' },
  freshener: { icon: 'mdi:air-freshener', color: '#98FB98', bgColor: '#F0FFF0' },
  spray: { icon: 'mdi:spray', color: '#87CEEB', bgColor: '#F0FFFF' },
  lavender: { icon: 'mdi:flower', color: '#9370DB', bgColor: '#E6E6FA' },
  calming: { icon: 'mdi:spa', color: '#20B2AA', bgColor: '#E0FFFF' },
  relaxing: { icon: 'mdi:spa-outline', color: '#48D1CC', bgColor: '#E0FFFF' },
  
  // Seasonal
  christmas: { icon: 'noto:christmas-tree', color: '#228B22', bgColor: '#FFE4E1' },
  halloween: { icon: 'noto:jack-o-lantern', color: '#FF8C00', bgColor: '#FFF8DC' },
  birthday: { icon: 'noto:birthday-cake', color: '#FF69B4', bgColor: '#FFF0F5' },
  
  // New arrivals
  new: { icon: 'noto:sparkles', color: '#FFD700', bgColor: '#FFFACD' },
  sale: { icon: 'noto:money-bag', color: '#32CD32', bgColor: '#F0FFF0' },
  popular: { icon: 'noto:fire', color: '#FF4500', bgColor: '#FFF5EE' },
  
  // Default
  default: { icon: 'noto:paw-prints', color: '#A0938E', bgColor: '#FDF8F6' },
};

function findBestMatch(categoryName: string): { icon: string; color: string; bgColor: string } {
  const lowerName = categoryName.toLowerCase();
  
  // Direct match
  if (iconMapping[lowerName]) {
    return iconMapping[lowerName];
  }
  
  // Partial match
  for (const [keyword, data] of Object.entries(iconMapping)) {
    if (lowerName.includes(keyword) || keyword.includes(lowerName)) {
      return data;
    }
  }
  
  // Word-by-word match
  const words = lowerName.split(/[\s-_]+/);
  for (const word of words) {
    if (word.length < 2) continue;
    if (iconMapping[word]) {
      return iconMapping[word];
    }
    for (const [keyword, data] of Object.entries(iconMapping)) {
      if (keyword.includes(word) || word.includes(keyword)) {
        return data;
      }
    }
  }
  
  return iconMapping.default;
}

async function fetchIconFromIconify(iconName: string): Promise<string | null> {
  try {
    // Iconify API - returns SVG
    const response = await fetch(`https://api.iconify.design/${iconName}.svg?height=120`);
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function generateSVGWithIcon(iconSvg: string, color: string, bgColor: string): string {
  // Extract the inner content of the fetched SVG
  const innerMatch = iconSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
  const innerContent = innerMatch ? innerMatch[1] : '';
  
  // Get viewBox from original SVG or use default
  const viewBoxMatch = iconSvg.match(/viewBox="([^"]*)"/);
  const originalViewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
  
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(bgColor, -15)};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${color}" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#bg)" stroke="${color}" stroke-width="2" filter="url(#shadow)"/>
  <g transform="translate(40, 40)">
    <svg viewBox="${originalViewBox}" width="120" height="120">
      ${innerContent}
    </svg>
  </g>
</svg>`.trim();

  return svg;
}

function generateFallbackSVG(emoji: string, color: string, bgColor: string): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${adjustColor(bgColor, -15)};stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="${color}" flood-opacity="0.25"/>
    </filter>
  </defs>
  <circle cx="100" cy="100" r="95" fill="url(#bg)" stroke="${color}" stroke-width="2" filter="url(#shadow)"/>
  <text x="100" y="115" font-size="80" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
</svg>`.trim();
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function svgToDataUrl(svg: string): string {
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Emoji fallbacks for when Iconify fails
const emojiFallbacks: Record<string, string> = {
  dog: '🐕', cat: '🐱', bird: '🐦', fish: '🐠', hamster: '🐹',
  rabbit: '🐰', turtle: '🐢', food: '🍽️', toys: '🧸', health: '❤️',
  grooming: '✨', beds: '🛏️', training: '🎓', outdoor: '🌳',
  default: '🐾',
};

export async function POST(request: Request) {
  try {
    const { categoryName } = await request.json();

    if (!categoryName || typeof categoryName !== 'string') {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    const { icon, color, bgColor } = findBestMatch(categoryName);
    
    // Try to fetch icon from Iconify
    const iconSvg = await fetchIconFromIconify(icon);
    
    let svg: string;
    if (iconSvg) {
      svg = generateSVGWithIcon(iconSvg, color, bgColor);
    } else {
      // Fallback to emoji
      const baseKeyword = categoryName.toLowerCase().split(/[\s-_]+/)[0];
      const emoji = emojiFallbacks[baseKeyword] || emojiFallbacks.default;
      svg = generateFallbackSVG(emoji, color, bgColor);
    }
    
    const dataUrl = svgToDataUrl(svg);

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      icon,
      color,
      bgColor,
      source: iconSvg ? 'iconify' : 'emoji',
    });
  } catch (error) {
    console.error('Error generating category icon:', error);
    return NextResponse.json(
      { error: 'Failed to generate icon' },
      { status: 500 }
    );
  }
}
