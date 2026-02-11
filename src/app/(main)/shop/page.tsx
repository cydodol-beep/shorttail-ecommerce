'use client';

import { Suspense } from 'react';
import { MarketplaceLanding } from '@/app/marketplace/components/marketplace-landing';
import { MarketplaceSkeleton } from '@/app/marketplace/components/marketplace-skeleton';

export const dynamic = 'force-dynamic';

export default function ShopPage() {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceLanding />
    </Suspense>
  );
}
