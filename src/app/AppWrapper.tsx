'use client';

import { ReactNode, useEffect, useState } from 'react';
import { IdleTimeoutProvider } from '@/components/IdleTimeoutProvider';

interface AppWrapperProps {
  children: ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <IdleTimeoutProvider>
      {children}
    </IdleTimeoutProvider>
  );
}