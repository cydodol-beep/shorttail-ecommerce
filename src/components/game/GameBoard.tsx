'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/useGameStore';
import { Dog, Candy, Coffee, Car } from 'lucide-react';
import LevelUpNotification from './LevelUpNotification';
import ComboNotification from './ComboNotification';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: 'cat' | 'puddle' | 'mailman';
  width: number;
  height: number;
}

interface Treat {
  id: number;
  x: number;
  y: number;
  type: 'bone' | 'cookie' | 'meat';
  width: number;
  height: number;
}

const GAME_HEIGHT = 400;
const GROUND_HEIGHT = 50;
const DOG_SIZE = 40;
const OBSTACLE_SIZE = 40;
const TREAT_SIZE = 25;

export default function GameBoard() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpVelocity, setJumpVelocity] = useState(0);
  const gravity = 0.5;
  const jumpStrength = -12;

  const {
    score,
    isPlaying,
    isGameOver,
    setPlaying,
    setGameOver,
    incrementScore,
    resetCombo,
    selectedCharacter,
    availableCharacters,
    gameSpeed,
    level,
    updateLevel,
    syncGameToDatabase,
  } = useGameStore();

  const [dogPosition, setDogPosition] = useState(GAME_HEIGHT - GROUND_HEIGHT - DOG_SIZE);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [treats, setTreats] = useState<Treat[]>([]);
  const obstacleId = useRef(0);
  const treatId = useRef(0);
  const gameSpeedRef = useRef(gameSpeed);

  // Get current character data
  const currentCharacter = availableCharacters.find(char => char.id === selectedCharacter) || availableCharacters[0];

  // Initialize game
  const startGame = () => {
    setGameStarted(true);
    setPlaying(true);
    setGameOver(false);
    setDogPosition(GAME_HEIGHT - GROUND_HEIGHT - DOG_SIZE);
    setObstacles([]);
    setTreats([]);
    obstacleId.current = 0;
    treatId.current = 0;
    resetCombo();
  };

  // Handle jump
  const jump = () => {
    if (!isJumping && isPlaying && !isGameOver) {
      setIsJumping(true);
      setJumpVelocity(jumpStrength * currentCharacter.jumpHeight);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'ArrowUp') && !isGameOver) {
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isJumping, isPlaying, isGameOver, currentCharacter]);

  // Update character selection
  useEffect(() => {
    // When character changes during gameplay, make sure we use the right character
    // This effect ensures that the currentCharacter is always up-to-date
    const updatedCharacter = availableCharacters.find(char => char.id === selectedCharacter) || availableCharacters[0];
    // Current implementation already handles this correctly in the render
  }, [selectedCharacter, availableCharacters]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const gameLoop = () => {
      // Update dog position based on jump physics
      if (isJumping) {
        const newPosition = dogPosition + jumpVelocity;
        const groundLevel = GAME_HEIGHT - GROUND_HEIGHT - DOG_SIZE;

        if (newPosition >= groundLevel) {
          setDogPosition(groundLevel);
          setIsJumping(false);
          setJumpVelocity(0);
        } else {
          setDogPosition(newPosition);
          setJumpVelocity(prev => prev + gravity);
        }
      }

      // Update game speed reference
      gameSpeedRef.current = gameSpeed;

      // Move obstacles and treats based on character speed
      const effectiveSpeed = gameSpeedRef.current * 5 * currentCharacter.speed;
      setObstacles(prev => {
        const updated = prev
          .map(obs => ({ ...obs, x: obs.x - effectiveSpeed }))
          .filter(obs => obs.x > -OBSTACLE_SIZE);

        return updated;
      });

      setTreats(prev => {
        const updated = prev
          .map(treat => ({ ...treat, x: treat.x - effectiveSpeed }))
          .filter(treat => treat.x > -TREAT_SIZE);

        return updated;
      });

      // Generate new obstacles randomly
      if (Math.random() < 0.02) {
        const newObstacle: Obstacle = {
          id: obstacleId.current++,
          x: canvasRef.current?.clientWidth || 800,
          y: GAME_HEIGHT - GROUND_HEIGHT - OBSTACLE_SIZE,
          type: ['cat', 'puddle', 'mailman'][Math.floor(Math.random() * 3)] as 'cat' | 'puddle' | 'mailman',
          width: OBSTACLE_SIZE,
          height: OBSTACLE_SIZE,
        };
        setObstacles(prev => [...prev, newObstacle]);
      }

      // Generate new treats randomly
      if (Math.random() < 0.015) {
        const newTreat: Treat = {
          id: treatId.current++,
          x: canvasRef.current?.clientWidth || 800,
          y: Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - TREAT_SIZE - 100) + 50,
          type: ['bone', 'cookie', 'meat'][Math.floor(Math.random() * 3)] as 'bone' | 'cookie' | 'meat',
          width: TREAT_SIZE,
          height: TREAT_SIZE,
        };
        setTreats(prev => [...prev, newTreat]);
      }

      // Check collisions
      const dogRect = {
        x: 50,
        y: dogPosition,
        width: DOG_SIZE * (1.2 - currentCharacter.agility * 0.2), // Shiba Inu has smaller collision area
        height: DOG_SIZE * (1.2 - currentCharacter.agility * 0.2), // Shiba Inu has smaller collision area
      };

      // Check obstacle collisions
      for (const obstacle of obstacles) {
        if (
          dogRect.x < obstacle.x + obstacle.width &&
          dogRect.x + dogRect.width > obstacle.x &&
          dogRect.y < obstacle.y + obstacle.height &&
          dogRect.y + dogRect.height > obstacle.y
        ) {
          // Collision detected - end game
          setPlaying(false);
          setGameOver(true);
          return;
        }
      }

      // Check treat collisions
      for (const treat of treats) {
        if (
          dogRect.x < treat.x + treat.width &&
          dogRect.x + dogRect.width > treat.x &&
          dogRect.y < treat.y + treat.height &&
          dogRect.y + dogRect.height > treat.y
        ) {
          // Treat collected - remove treat and increment score
          setTreats(prev => prev.filter(t => t.id !== treat.id));

          // Apply combo bonus if applicable
          const currentCombo = useGameStore.getState().combo;
          const comboBonus = currentCombo > 0 && currentCombo % 5 === 0 ? currentCombo : 1;
          incrementScore(10 * comboBonus);
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, isGameOver, dogPosition, jumpVelocity, isJumping, obstacles, treats, incrementScore, gameSpeed, currentCharacter]);

  // Check level up
  useEffect(() => {
    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      updateLevel();
    }
  }, [score, level, updateLevel]);

  // Sync game results to database when game ends
  useEffect(() => {
    if (isGameOver) {
      // Sync the game results to the database
      syncGameToDatabase();
    }
  }, [isGameOver, syncGameToDatabase]);

  // Touch controls for mobile
  const handleTouchStart = () => {
    jump();
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto">
      <LevelUpNotification />
      <ComboNotification />

      <div className="w-full bg-[#E6D5B8] dark:bg-[#3D2C1E] rounded-xl p-4 mb-4 border-2 border-[#C08261] dark:border-[#634832]">
        <div className="flex justify-between items-center mb-2">
          <div className="text-lg font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">
            Score: {score}
          </div>
          <div className="text-lg font-bold text-[#3D2C1E] dark:text-[#E6D5B8]">
            Level: {level}
          </div>
        </div>

        <div
          ref={canvasRef}
          className="relative w-full h-[400px] bg-[#D4B99C] dark:bg-[#4D3D2E] rounded-lg border-4 border-[#634832] dark:border-[#C08261] overflow-hidden"
          onClick={jump}
          onTouchStart={handleTouchStart}
        >
          {/* Ground */}
          <div
            className="absolute bottom-0 w-full bg-[#634832] dark:bg-[#5A4735]"
            style={{ height: `${GROUND_HEIGHT}px` }}
          />

          {/* Dog character */}
          <motion.div
            className="absolute"
            style={{
              left: '50px',
              bottom: `${dogPosition}px`,
              width: `${DOG_SIZE}px`,
              height: `${DOG_SIZE}px`,
            }}
            animate={{ y: dogPosition }}
            transition={{ type: 'tween', duration: 0.05 }}
            whileTap={{ scale: 1.1 }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ backgroundColor: currentCharacter.color }}
            >
              <Dog className="w-6 h-6 text-white" />
            </div>
          </motion.div>

          {/* Obstacles */}
          <AnimatePresence>
            {obstacles.map((obstacle) => (
              <motion.div
                key={obstacle.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${obstacle.x}px`,
                  bottom: `${obstacle.y}px`,
                  width: `${OBSTACLE_SIZE}px`,
                  height: `${OBSTACLE_SIZE}px`,
                }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {obstacle.type === 'cat' && (
                  <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-black rounded-full"></div>
                  </div>
                )}
                {obstacle.type === 'puddle' && (
                  <div className="w-full h-full bg-blue-400 rounded-full opacity-70"></div>
                )}
                {obstacle.type === 'mailman' && (
                  <div className="w-full h-full bg-blue-600 rounded flex items-center justify-center">
                    <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Treats */}
          <AnimatePresence>
            {treats.map((treat) => (
              <motion.div
                key={treat.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${treat.x}px`,
                  top: `${treat.y}px`,
                  width: `${TREAT_SIZE}px`,
                  height: `${TREAT_SIZE}px`,
                }}
                initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{
                  scale: { repeat: Infinity, repeatType: "reverse", duration: 1 },
                  rotate: { duration: 2, repeat: Infinity, ease: "linear" }
                }}
              >
                {treat.type === 'bone' && <Coffee className="w-6 h-6 text-brown-700 dark:text-brown-300" />}
                {treat.type === 'cookie' && <Candy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
                {treat.type === 'meat' && <div className="w-5 h-5 bg-red-500 rounded-full"></div>}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Start overlay */}
          {!gameStarted && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center p-6 bg-[#E6D5B8] dark:bg-[#3D2C1E] rounded-xl border-2 border-[#C08261] dark:border-[#634832]">
                <h2 className="text-2xl font-bold mb-4 text-[#3D2C1E] dark:text-[#E6D5B8]">Paws & Paths</h2>
                <p className="mb-4 text-[#6B533D] dark:text-[#B8A090]">
                  Tap or press SPACE to jump over obstacles and collect treats!
                </p>
                <Button
                  onClick={startGame}
                  className="bg-[#C08261] hover:bg-[#A66A4E] text-white dark:bg-[#634832] dark:hover:bg-[#5A4735]"
                >
                  Start Game
                </Button>
              </div>
            </div>
          )}

          {/* Game over overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center p-6 bg-[#E6D5B8] dark:bg-[#3D2C1E] rounded-xl border-2 border-[#C08261] dark:border-[#634832]">
                <h2 className="text-2xl font-bold mb-2 text-[#3D2C1E] dark:text-[#E6D5B8]">Game Over!</h2>
                <p className="mb-2 text-[#6B533D] dark:text-[#B8A090]">Final Score: {score}</p>
                <p className="mb-4 text-[#6B533D] dark:text-[#B8A090]">Level Reached: {level}</p>
                <Button
                  onClick={startGame}
                  className="bg-[#C08261] hover:bg-[#A66A4E] text-white dark:bg-[#634832] dark:hover:bg-[#5A4735]"
                >
                  Play Again
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Controls */}
        <div className="mt-4 flex justify-center md:hidden">
          <Button
            onClick={jump}
            className="w-32 h-16 text-lg bg-[#C08261] hover:bg-[#A66A4E] text-white dark:bg-[#634832] dark:hover:bg-[#5A4735]"
          >
            JUMP
          </Button>
        </div>
      </div>
    </div>
  );
}