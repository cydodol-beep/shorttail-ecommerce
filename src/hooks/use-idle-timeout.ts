import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

// Default timeout: 15 minutes in milliseconds
const DEFAULT_TIMEOUT = 15 * 60 * 1000;

export function useIdleTimeout(timeoutMs: number = DEFAULT_TIMEOUT) {
  const { signOut, user } = useAuth();
  const [timeLeft, setTimeLeft] = useState<number>(timeoutMs);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(true);

  // Reset the timer
  const resetTimer = useCallback(() => {
    if (isExpired) {
      setIsExpired(false);
    }
    setTimeLeft(timeoutMs);
    setIsActive(true);
  }, [isExpired, timeoutMs]);

  // Logout function
  const logout = useCallback(async () => {
    setIsActive(false);
    setIsExpired(true);
    
    try {
      await signOut();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during idle logout:', error);
      // Redirect to login even if signOut fails
      window.location.href = '/login';
    }
  }, [signOut]);

  // Setup the timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let countdownId: NodeJS.Timeout;

    if (user && isActive && !isExpired) {
      // Start countdown to show time-left
      countdownId = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1000) { // Less than 1 second left
            clearInterval(countdownId);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);

      // Set the main timeout
      timeoutId = setTimeout(() => {
        logout();
      }, timeLeft);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (countdownId) {
        clearInterval(countdownId);
      }
    };
  }, [user, isActive, isExpired, logout, timeLeft]);

  // Add event listeners to reset timer on user activity
  useEffect(() => {
    if (!user) {
      return; // Don't set up listeners if user is not logged in
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'keydown'];

    const resetTimerFromEvent = () => resetTimer();

    events.forEach(event => {
      document.addEventListener(event, resetTimerFromEvent, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimerFromEvent, true);
      });
    };
  }, [user, resetTimer]);

  // Format time left for display (MM:SS)
  const formatTimeLeft = useCallback(() => {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  return {
    timeLeft,
    isExpired,
    isActive,
    resetTimer,
    logout,
    formatTimeLeft,
    formattedTime: formatTimeLeft(),
  };
}