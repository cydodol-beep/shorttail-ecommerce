// Sound utility for the game using Web Audio API
let audioContext: AudioContext | null = null;
let isMuted = false;
let backgroundGainNode: GainNode | null = null;
let currentMusicBuffer: AudioBuffer | null = null;
let musicSource: AudioBufferSourceNode | null = null;

// Initialize audio context
export const initAudio = (): void => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    backgroundGainNode = audioContext.createGain();
    backgroundGainNode.connect(audioContext.destination);
    setMusicIntensity(0.3); // Default background music volume
  }
};

// Create simple sound effects using Web Audio API
const createSound = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.2): void => {
  if (isMuted || !audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gainNode.gain.value = volume;
  gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
};

// Create sound effects based on type
export const playSound = (soundType: string): void => {
  if (isMuted) return;

  initAudio();

  switch (soundType) {
    case 'click':
      createSound(800, 0.05, 'square');
      break;
    case 'catch':
      createSound(1200, 0.1, 'sine');
      break;
    case 'hit':
      createSound(200, 0.15, 'sawtooth');
      break;
    case 'miss':
      createSound(100, 0.1, 'square');
      break;
    case 'levelUp':
      // Play a rising tone
      createSound(523.25, 0.1, 'sine'); // C5
      setTimeout(() => {
        if (!isMuted) {
          createSound(659.25, 0.1, 'sine'); // E5
          setTimeout(() => {
            if (!isMuted) {
              createSound(783.99, 0.15, 'sine'); // G5
            }
          }, 100);
        }
      }, 100);
      break;
    case 'happy':
      // Play a cheerful sound
      createSound(1000, 0.08, 'sine');
      setTimeout(() => {
        if (!isMuted) {
          createSound(1200, 0.08, 'sine');
        }
      }, 80);
      break;
    case 'bonus':
      // Play a rewarding sound
      createSound(1500, 0.1, 'sine');
      setTimeout(() => {
        if (!isMuted) {
          createSound(2000, 0.1, 'sine');
        }
      }, 100);
      break;
    default:
      // For unknown sound types, play a simple beep
      createSound(440, 0.1, 'sine');
  }
};

// Background music - we'll create simple procedural music
let musicInterval: NodeJS.Timeout | null = null;

export const startMusic = (): void => {
  if (isMuted || !audioContext) return;

  if (!musicInterval) {
    // Simple procedural background music
    let noteIndex = 0;
    const scale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25]; // C major scale

    musicInterval = setInterval(() => {
      if (!isMuted && audioContext) {
        createSound(scale[noteIndex % scale.length], 0.2, 'triangle', 0.1);
        noteIndex = (noteIndex + 1) % scale.length;
      }
    }, 500); // Change note every 500ms
  }
};

export const stopMusic = (): void => {
  if (musicInterval) {
    clearInterval(musicInterval);
    musicInterval = null;
  }
  if (musicSource) {
    musicSource.stop();
    musicSource = null;
  }
};

export const setMusicIntensity = (intensity: number): void => {
  if (backgroundGainNode) {
    // Map intensity (0-1) to volume (0.1 to 0.5)
    const volume = 0.1 + (intensity * 0.4);
    backgroundGainNode.gain.value = volume;
  }
};

export const toggleMute = (): boolean => {
  isMuted = !isMuted;
  return isMuted;
};

export const getMuteState = (): boolean => {
  return isMuted;
};