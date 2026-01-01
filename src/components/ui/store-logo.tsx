'use client';

import { PawPrint } from 'lucide-react';
import { useStoreSettings } from '@/hooks/use-store-settings';
import { cn } from '@/lib/utils';

interface StoreLogoProps {
  className?: string;
  iconClassName?: string;
  fallbackSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Fixed pixel size for the logo image (e.g., 400 for 400x400) */
  imageSize?: number;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
  '2xl': 'h-24 w-24',
};

export function StoreLogo({ 
  className, 
  iconClassName,
  fallbackSize = 'md',
  imageSize,
}: StoreLogoProps) {
  const { settings: storeSettings } = useStoreSettings();

  if (storeSettings?.storeLogo) {
    const imgStyle = imageSize ? { width: imageSize, height: imageSize } : undefined;
    
    return (
      <div className={cn('relative flex-shrink-0', className)}>
        <img
          src={storeSettings.storeLogo}
          alt={storeSettings.storeName || 'Store Logo'}
          className="w-full h-full object-contain"
          style={imgStyle}
        />
      </div>
    );
  }

  // Fallback to PawPrint icon
  return (
    <PawPrint className={cn(sizeClasses[fallbackSize], iconClassName)} />
  );
}
