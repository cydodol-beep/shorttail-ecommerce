'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface Advertisement {
  id: string;
  imageUrl: string;
  redirectLink: string | null;
  altText: string;
}

const STORAGE_KEY = 'shorttail_ad_popup_hidden';
const HIDE_DURATION_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

export function AdvertisementPopup() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Check if popup should be hidden based on localStorage
  const shouldShowPopup = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    const hiddenUntil = localStorage.getItem(STORAGE_KEY);
    if (!hiddenUntil) return true;
    
    const hiddenUntilTime = parseInt(hiddenUntil, 10);
    if (isNaN(hiddenUntilTime)) return true;
    
    return Date.now() > hiddenUntilTime;
  }, []);

  // Fetch active advertisements
  const fetchAds = useCallback(async () => {
    console.log('[AdPopup] Fetching advertisements...');
    try {
      const response = await fetch('/api/active-ads');
      if (!response.ok) throw new Error('Failed to fetch ads');
      
      const data = await response.json();
      console.log('[AdPopup] Fetched ads:', data.ads?.length || 0, 'ads');
      
      if (data.ads && data.ads.length > 0) {
        setAds(data.ads);
        
        // Only show popup if not hidden
        const canShow = shouldShowPopup();
        console.log('[AdPopup] Can show popup:', canShow);
        
        if (canShow) {
          // Small delay for better UX
          setTimeout(() => {
            console.log('[AdPopup] Opening popup...');
            setIsOpen(true);
          }, 1500);
        }
      }
    } catch (error) {
      console.error('[AdPopup] Error fetching advertisements:', error);
    } finally {
      setLoading(false);
    }
  }, [shouldShowPopup]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Auto-slide carousel every 5 seconds
  useEffect(() => {
    if (isOpen && ads.length > 1) {
      autoSlideRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
    }

    return () => {
      if (autoSlideRef.current) {
        clearInterval(autoSlideRef.current);
      }
    };
  }, [isOpen, ads.length]);

  const handleClose = () => {
    if (dontShowAgain) {
      // Set localStorage to hide for 48 hours
      const hideUntil = Date.now() + HIDE_DURATION_MS;
      localStorage.setItem(STORAGE_KEY, hideUntil.toString());
    }
    setIsOpen(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + ads.length) % ads.length);
    // Reset auto-slide timer
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % ads.length);
    // Reset auto-slide timer
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
    }
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
    // Reset auto-slide timer
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % ads.length);
      }, 5000);
    }
  };

  if (loading || ads.length === 0 || !isOpen) {
    return null;
  }

  const currentAd = ads[currentIndex];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
          >
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 bg-white/90 hover:bg-white shadow-md rounded-full h-8 w-8"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Carousel Container */}
            <div className="relative">
              {/* Ad Image */}
              <div className="relative aspect-square bg-brown-100 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAd.id}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                  >
                    {currentAd.redirectLink ? (
                      <Link
                        href={currentAd.redirectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full h-full cursor-pointer"
                        onClick={handleClose}
                      >
                        <img
                          src={currentAd.imageUrl}
                          alt={currentAd.altText}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </Link>
                    ) : (
                      <img
                        src={currentAd.imageUrl}
                        alt={currentAd.altText}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Arrows (only if multiple ads) */}
                {ads.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full h-10 w-10"
                      onClick={handlePrevious}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white shadow-md rounded-full h-10 w-10"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>

              {/* Carousel Dots */}
              {ads.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  {ads.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'bg-white w-6 shadow-md'
                          : 'bg-white/60 hover:bg-white/80'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gradient-to-t from-brown-50 to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dont-show"
                    checked={dontShowAgain}
                    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                  />
                  <Label
                    htmlFor="dont-show"
                    className="text-sm text-brown-600 cursor-pointer"
                  >
                    Don&apos;t show again for 48 hours
                  </Label>
                </div>
                
                {currentAd.redirectLink && (
                  <Link
                    href={currentAd.redirectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    onClick={handleClose}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Learn More
                  </Link>
                )}
              </div>

              {/* Ad Counter */}
              {ads.length > 1 && (
                <div className="mt-2 text-center text-xs text-brown-400">
                  {currentIndex + 1} of {ads.length}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
