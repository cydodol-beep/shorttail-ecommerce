'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';

// Default timeout: 15 minutes
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;

interface IdleTimeoutProviderProps {
  children: React.ReactNode;
  timeoutMs?: number;
}

export function IdleTimeoutProvider({ children, timeoutMs = IDLE_TIMEOUT_MS }: IdleTimeoutProviderProps) {
  const { user, idleTimeoutActive } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  
  // Use the idle timeout hook
  const { 
    timeLeft, 
    isExpired, 
    isActive, 
    resetTimer, 
    logout, 
    formattedTime 
  } = useIdleTimeout(timeoutMs);

  // Show warning when 5 minutes are left
  useEffect(() => {
    if (user && timeLeft <= 5 * 60 * 1000 && timeLeft > 0) { // 5 minutes left
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [user, timeLeft]);

  // If timeout is disabled, don't render the provider
  if (!idleTimeoutActive) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Warning dialog when timeout is approaching */}
      {showWarning && !isExpired && (
        <div className="fixed bottom-4 right-4 z-50 bg-amber-100 border border-amber-300 text-amber-800 px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Session Expiring Soon</h3>
              <div className="mt-1 text-sm">
                <p>Your session will expire in {formattedTime}. Interact with the page to continue.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {children}
    </>
  );
}