'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAds, useAdViewTracking } from '@/hooks/use-ads';
import type { AdvertisementCampaign } from '@/types/database';

interface InterstitialAdProps {
  className?: string;
  showAfterScroll?: boolean;
  scrollThreshold?: number;
}

export function InterstitialAd({
  className,
  showAfterScroll = true,
  scrollThreshold = 500,
}: InterstitialAdProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [currentAd, setCurrentAd] = useState<AdvertisementCampaign | null>(null);
  
  const { ads, isLoading, trackImpression, trackClick } = useAds({
    position: 'interstitial',
    enabled: true,
  });

  // Show ad after scroll threshold
  useEffect(() => {
    if (!showAfterScroll || hasShown || isLoading || ads.length === 0) return;

    const handleScroll = () => {
      if (window.scrollY > scrollThreshold && !hasShown) {
        setCurrentAd(ads[0]);
        setIsVisible(true);
        setHasShown(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showAfterScroll, scrollThreshold, hasShown, isLoading, ads]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleClick = () => {
    if (currentAd) {
      trackClick(currentAd.id);
      if (currentAd.link_url) {
        window.open(currentAd.link_url, '_blank');
      }
    }
  };

  const viewRef = useAdViewTracking(
    currentAd?.id || '',
    (adId) => trackImpression(adId),
    { threshold: 0.3 }
  );

  if (isLoading || ads.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && currentAd && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm',
            className
          )}
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Advertisement"
        >
          <motion.div
            ref={viewRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              aria-label="Close advertisement"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ad Content */}
            <Card className="overflow-hidden border-2 border-accent/20">
              <div
                className="relative aspect-[4/3] bg-brown-100 cursor-pointer group"
                onClick={handleClick}
              >
                {currentAd.image_url ? (
                  <Image
                    src={currentAd.image_url}
                    alt={currentAd.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 400px"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-brown-50">
                    <span className="text-brown-400">No Image</span>
                  </div>
                )}

                {/* Ad Label */}
                <div className="absolute top-3 left-3">
                  <span className="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded-full">
                    Advertisement
                  </span>
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ExternalLink className="w-10 h-10 text-white drop-shadow-lg" />
                </div>
              </div>

              <div className="p-4 bg-white">
                <h3 className="text-lg font-bold text-brown-900 mb-1">
                  {currentAd.title}
                </h3>
                {currentAd.description && (
                  <p className="text-sm text-brown-600 mb-4">
                    {currentAd.description}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleClick}
                    className="flex-1"
                    variant={currentAd.link_url ? 'default' : 'secondary'}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {currentAd.link_url ? 'Learn More' : 'View Details'}
                  </Button>
                  <Button
                    onClick={handleClose}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline interstitial for mobile (between product rows)
export function InlineInterstitialAd({
  className,
  onVisible,
}: {
  className?: string;
  onVisible?: () => void;
}) {
  const [currentAd, setCurrentAd] = useState<AdvertisementCampaign | null>(null);
  const { ads, isLoading, trackImpression, trackClick } = useAds({
    position: 'interstitial',
    enabled: true,
  });

  useEffect(() => {
    if (!isLoading && ads.length > 0) {
      // Pick a random ad
      const randomIndex = Math.floor(Math.random() * ads.length);
      setCurrentAd(ads[randomIndex]);
    }
  }, [isLoading, ads]);

  const viewRef = useAdViewTracking(
    currentAd?.id || '',
    (adId) => {
      trackImpression(adId);
      onVisible?.();
    },
    { threshold: 0.5 }
  );

  const handleClick = () => {
    if (currentAd) {
      trackClick(currentAd.id);
      if (currentAd.link_url) {
        window.open(currentAd.link_url, '_blank');
      }
    }
  };

  if (isLoading || !currentAd) return null;

  return (
    <div
      ref={viewRef}
      className={cn(
        'col-span-full my-4',
        className
      )}
    >
      <Card className="overflow-hidden border-2 border-dashed border-accent/30 bg-gradient-to-r from-amber-50 to-orange-50">
        <div
          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/50 transition-colors"
          onClick={handleClick}
        >
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-white">
            {currentAd.image_url ? (
              <Image
                src={currentAd.image_url}
                alt={currentAd.title}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-brown-50">
                <span className="text-xs text-brown-400">Ad</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">
              Sponsored
            </span>
            <h4 className="font-semibold text-brown-900 line-clamp-1">
              {currentAd.title}
            </h4>
            {currentAd.description && (
              <p className="text-sm text-brown-600 line-clamp-2 mt-0.5">
                {currentAd.description}
              </p>
            )}
          </div>

          <ExternalLink className="w-5 h-5 text-brown-400 flex-shrink-0" />
        </div>
      </Card>
    </div>
  );
}
