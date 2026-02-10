'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ExternalLink, X } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAds, useAdViewTracking } from '@/hooks/use-ads';
import type { AdvertisementCampaign } from '@/types/database';

interface SidebarAdsProps {
  className?: string;
  maxAds?: number;
}

function AdCard({
  ad,
  onImpression,
  onClick,
}: {
  ad: AdvertisementCampaign;
  onImpression: (adId: string) => void;
  onClick: (adId: string, url: string) => void;
}) {
  const viewRef = useAdViewTracking(ad.id, onImpression);

  return (
    <motion.div
      ref={viewRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <Card className="overflow-hidden border-brown-200 hover:border-accent transition-colors">
        <Link
          href={ad.link_url || '#'}
          target={ad.link_url?.startsWith('http') ? '_blank' : undefined}
          rel={ad.link_url?.startsWith('http') ? 'noopener noreferrer' : undefined}
          onClick={(e) => {
            if (ad.link_url) {
              e.preventDefault();
              onClick(ad.id, ad.link_url);
            }
          }}
          className="block"
        >
          <div className="relative aspect-[4/5] bg-brown-100 overflow-hidden">
            {ad.image_url ? (
              <Image
                src={ad.image_url}
                alt={ad.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="300px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-brown-50">
                <span className="text-brown-400 text-sm">No Image</span>
              </div>
            )}

            {/* Ad Label */}
            <div className="absolute top-2 right-2">
              <span className="px-2 py-0.5 text-[10px] bg-black/50 text-white rounded-full">
                Ad
              </span>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <ExternalLink className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>

          <CardContent className="p-3">
            <h4 className="font-semibold text-brown-900 text-sm line-clamp-2 group-hover:text-accent transition-colors">
              {ad.title}
            </h4>
            {ad.description && (
              <p className="text-xs text-brown-500 mt-1 line-clamp-2">
                {ad.description}
              </p>
            )}
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}

export function SidebarAds({ className, maxAds = 3 }: SidebarAdsProps) {
  const { ads, isLoading, trackImpression, trackClick } = useAds({
    position: 'sidebar',
    enabled: true,
  });

  const handleImpression = (adId: string) => {
    trackImpression(adId);
  };

  const handleClick = (adId: string, url: string) => {
    trackClick(adId);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <h3 className="text-sm font-semibold text-brown-900 uppercase tracking-wide">
          Sponsored
        </h3>
        {[1, 2].map((i) => (
          <Card key={i} className="overflow-hidden border-brown-200">
            <Skeleton className="aspect-[4/5]" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (ads.length === 0) {
    return null;
  }

  const displayAds = ads.slice(0, maxAds);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brown-500 uppercase tracking-wide">
          Sponsored
        </h3>
      </div>

      <div className="space-y-4">
        {displayAds.map((ad) => (
          <AdCard
            key={ad.id}
            ad={ad}
            onImpression={handleImpression}
            onClick={handleClick}
          />
        ))}
      </div>
    </div>
  );
}

// Sticky version for desktop
export function StickySidebarAds({ className, maxAds = 3 }: SidebarAdsProps) {
  return (
    <div className={cn('sticky top-24', className)}>
      <SidebarAds maxAds={maxAds} />
    </div>
  );
}
