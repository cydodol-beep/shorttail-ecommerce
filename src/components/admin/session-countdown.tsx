'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export function SessionCountdown() {
  const { user, profile, isMasterAdmin, isSuperUser } = useAuth();
  const [countdown, setCountdown] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show countdown for master admin and super user roles
    setIsVisible(isMasterAdmin || isSuperUser);
  }, [isMasterAdmin, isSuperUser]);

  useEffect(() => {
    if (!isVisible) return;

    let interval: NodeJS.Timeout | null = null;

    // Function to update the countdown
    const updateCountdown = async () => {
      try {
        // Get the current session to access the expiration time
        const supabase = (await import('@/lib/supabase/client')).createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session?.expires_at) {
          setCountdown('Session expired');
          return;
        }

        const expirationTime = session.expires_at * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeLeft = expirationTime - now;

        if (timeLeft <= 0) {
          setCountdown('Session expired');
          return;
        }

        // Calculate hours, minutes and seconds
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      } catch (err) {
        console.error('Error updating session countdown:', err);
        setCountdown('Error');
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    interval = setInterval(updateCountdown, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible || !countdown) {
    return null;
  }

  return (
    <Card className="border-0 bg-red-50 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-red-800">Session expires in:</span>
          <span className="text-sm font-bold text-red-600">{countdown}</span>
        </div>
      </CardContent>
    </Card>
  );
}