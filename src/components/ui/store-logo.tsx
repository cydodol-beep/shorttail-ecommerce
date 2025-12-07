'use client';

import { PawPrint } from 'lucide-react';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { cn } from '@/lib/utils';

interface StoreLogoProps {
  className?: string;
  iconClassName?: string;
  fallbackSize?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function StoreLogo({ 
  className, 
  iconClassName,
  fallbackSize = 'md' 
}: StoreLogoProps) {
  const { settings: storeSettings } = useStoreSettings();

  if (storeSettings?.storeLogo) {
    return (
      <div className={cn('relative flex-shrink-0', className)}>
        {storeSettings.storeLogo.startsWith('data:') ? (
          <img
            src={storeSettings.storeLogo}
            alt={storeSettings.storeName || 'Store Logo'}
            className="w-full h-full object-contain"
          />
        ) : (
          <img
            src={storeSettings.storeLogo}
            alt={storeSettings.storeName || 'Store Logo'}
            className="w-full h-full object-contain"
          />
        )}
      </div>
    );
  }

  // Fallback to PawPrint icon
  return (
    <PawPrint className={cn(sizeClasses[fallbackSize], iconClassName)} />
  );
}
