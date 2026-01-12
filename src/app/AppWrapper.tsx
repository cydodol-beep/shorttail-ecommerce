'use client';

import { ReactNode, useEffect, useState } from 'react';
import { IdleTimeoutProvider } from '@/components/IdleTimeoutProvider';
import { ProfileCompletionGuide } from '@/components/ProfileCompletionGuide';
import { useTrafficLogger } from '@/hooks/use-traffic-logger';

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);
  useTrafficLogger(); // Initialize traffic logging

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <IdleTimeoutProvider>
      {children}
      <ProfileCompletionGuide />
    </IdleTimeoutProvider>
  );
}