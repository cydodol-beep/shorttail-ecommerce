'use client';

import { Suspense } from 'react';
import { MarketplaceContent } from '@/app/marketplace/components/marketplace-content';
import { MarketplaceSkeleton } from '@/app/marketplace/components/marketplace-skeleton';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<MarketplaceSkeleton />}>
        <MarketplaceContent />
      </Suspense>
    </main>
  );
}
