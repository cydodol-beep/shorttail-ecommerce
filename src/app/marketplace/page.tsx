'use client';

import { Suspense } from 'react';
import { MarketplaceContent } from '@/app/marketplace/components/marketplace-content';
import { MarketplaceSkeleton } from '@/app/marketplace/components/marketplace-skeleton';

export const dynamic = 'force-dynamic';

export default function MarketplacePage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceContent />
    </Suspense>
  );
}
