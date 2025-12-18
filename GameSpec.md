"Act as a Senior Full-Stack Developer and Game Designer. Help me build a 2D side-scrolling 'Dog Adventure' game integrated into my Next.js 16 (App Router) application.
1. Game Overview:
Title: Paws & Paths.
Vibe: Cute, addictive, 'Brownish' aesthetic (warm tones, cozy textures).
Core Mechanics: Side-scrolling runner. The dog moves right/left and jumps to avoid obstacles (cats, puddles, mailmen) and collect treats (points).
Control: Keyboard (Arrows/Space) and Touch buttons for mobile.
2. Tech Stack Requirements:
Frontend: Next.js 16 (Turbopack) using React Canvas API or Framer Motion for the game loop.
Styling: Tailwind CSS 4 with a custom 'Brownish' theme (Deep chocolate, tan, cream, and terra cotta).
State Management: Zustand with persist middleware to track 'Active Session Points' and 'Dog Selection'.
Backend: Supabase. Create a schema for a profiles table that tracks total_points, level, and unlocked_breeds.
UI: Use shadcn/ui for the 'Character Selection' modal and the 'Level Up' alerts.
3. Specific Features to Program:
Character Selection: Create a data object for 3 dog breeds (e.g., Golden Retriever for speed, Corgi for high jump, Shiba Inu for agility).
Leveling System: Difficulty increases by scaling the gameSpeed variable as points increase.
Point Syncing: Every time a user levels up or the game ends, use a Supabase RPC or upsert to sync points to the database.
Visuals: Use Lucide React icons for UI elements and suggest a way to use simple CSS shapes or SVG for the dog sprites to keep it 'minimalist cute.'
4. Deliverables:
useGameStore.ts: A Zustand store to manage score, game state (playing/gameover), and character choice.
GameBoard.tsx: The main Canvas-based game engine component.
CharacterSelect.tsx: A shadcn-based UI component for choosing the breed.
Supabase Logic: A function to update the user's global points in the database when a mission is completed.
Animations: Use Framer Motion for the 'Level Up' popup notification.
Please provide the code in a clean, modular format compatible with Next.js 16."
Why this prompt works for your stack:
Next.js 16 & Turbopack: The prompt ensures the code is structured for the App Router, avoiding legacy 'Pages' directory patterns.
Zustand Persist: This is crucial for your "addictive" requirement. If the user refreshes the page, they don't lose their chosen dog or their current session high score.
Tailwind 4 "Brownish" Theme: By specifying the color palette (chocolate, tan, terra cotta), the AI will generate class names like bg-brown-900 or text-tan-100 that fit your UI.
Supabase Integration: It asks for an upsert logic. This ensures that the points the user earns in the "Game" actually move into their "Web Account" balance.
Pro-Tips for your Design:
The "Addictive" Loop: Ask the AI to implement a "Combo Multiplier." If the dog collects 5 treats in a row without hitting an obstacle, the points double.
Visuals: Since you are using Lucide React, use the Dog icon but wrap it in a Framer Motion div with a "bounce" animation to make it feel like it's running.
The "Brownish" UI:
Background: #E6D5B8 (Soft Sand)
Platforms: #634832 (Dark Wood)
UI Accents: #C08261 (Terra Cotta)
Text: #3D2C1E (Deep Espresso)