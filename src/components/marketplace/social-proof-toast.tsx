'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, Users, Star, TrendingUp, Loader2 } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/database';

interface SocialProofEvent {
  id: string;
  type: 'purchase' | 'view' | 'cart' | 'review';
  message: string;
  location?: string;
  timeAgo: string;
  productImage?: string;
  userName?: string;
}

interface SocialProofToastProps {
  interval?: number;
  maxVisible?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

// Indonesian cities for location variety
const locations = ['Jakarta', 'Surabaya', 'Bandung', 'Yogyakarta', 'Medan', 'Semarang', 'Makassar', 'Denpasar', 'Palembang', 'Malang'];

// Get random location
function getRandomLocation(): string {
  return locations[Math.floor(Math.random() * locations.length)];
}

// Get time ago text
function getTimeAgo(): string {
  const times = ['Just now', '1 min ago', '2 mins ago', '3 mins ago', '5 mins ago'];
  return times[Math.floor(Math.random() * times.length)];
}

// Generate event from product
function generateEventFromProduct(product: Product, usedProductIds: Set<string>): SocialProofEvent | null {
  if (!product || !product.name) return null;
  
  // Skip if this product was just used
  if (usedProductIds.has(product.id)) {
    return null;
  }

  const eventTypes: ('purchase' | 'view' | 'cart' | 'review')[] = ['purchase', 'purchase', 'purchase', 'cart', 'view', 'review'];
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

  let message = '';
  let userName: string | undefined;

  switch (type) {
    case 'purchase':
      message = `Someone just bought ${product.name}`;
      break;
    case 'cart':
      message = `${Math.floor(Math.random() * 5) + 2} people added ${product.name} to cart`;
      break;
    case 'view':
      message = `${Math.floor(Math.random() * 15) + 3} people viewing ${product.name} now`;
      break;
    case 'review':
      const names = ['Budi', 'Ani', 'Siti', 'Ahmad', 'Rina', 'Dewi', 'Agus'];
      userName = names[Math.floor(Math.random() * names.length)];
      message = `${userName} gave ${product.name} 5 stars`;
      break;
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    location: type === 'purchase' ? getRandomLocation() : undefined,
    timeAgo: getTimeAgo(),
    productImage: product.main_image_url || undefined,
    userName,
  };
}

function getEventIcon(type: SocialProofEvent['type']) {
  switch (type) {
    case 'purchase':
      return ShoppingBag;
    case 'cart':
      return TrendingUp;
    case 'view':
      return Users;
    case 'review':
      return Star;
    default:
      return ShoppingBag;
  }
}

function getEventColor(type: SocialProofEvent['type']) {
  switch (type) {
    case 'purchase':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'cart':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'view':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'review':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function SocialProofToast({
  interval = 10000,
  maxVisible = 2,
  position = 'bottom-left',
}: SocialProofToastProps) {
  const [events, setEvents] = useState<SocialProofEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const supabase = createClient();
  const usedProductIdsRef = useRef<Set<string>>(new Set());
  const productIndexRef = useRef(0);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('id, name, main_image_url, is_active')
          .eq('is_active', true)
          .limit(50);

        if (fetchError) {
          console.error('Error fetching products for social proof:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (data && data.length > 0) {
          setProducts(data);
          console.log(`Loaded ${data.length} products for social proof notifications`);
        } else {
          console.warn('No active products found for social proof notifications');
          setError('No products available');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [supabase]);

  // Get next product (with rotation to avoid immediate repetition)
  const getNextProduct = useCallback((): Product | null => {
    if (products.length === 0) return null;

    // If we've used all products, clear the used set
    if (usedProductIdsRef.current.size >= products.length) {
      usedProductIdsRef.current.clear();
    }

    // Find a product that hasn't been used recently
    let attempts = 0;
    let product: Product | null = null;

    while (attempts < products.length && !product) {
      const candidate = products[productIndexRef.current % products.length];
      productIndexRef.current++;
      
      if (!usedProductIdsRef.current.has(candidate.id)) {
        product = candidate;
        usedProductIdsRef.current.add(candidate.id);
      }
      attempts++;
    }

    // Fallback: if all products are used, pick random and clear
    if (!product) {
      product = products[Math.floor(Math.random() * products.length)];
      usedProductIdsRef.current.clear();
      usedProductIdsRef.current.add(product.id);
    }

    return product;
  }, [products]);

  // Add new event
  const addEvent = useCallback(() => {
    if (isPaused || products.length === 0) return;

    const product = getNextProduct();
    if (!product) return;

    const newEvent = generateEventFromProduct(product, usedProductIdsRef.current);
    if (!newEvent) return;

    setEvents((prev) => {
      const updated = [newEvent, ...prev].slice(0, maxVisible);
      return updated;
    });

    // Remove event after display duration
    setTimeout(() => {
      setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
    }, 5000);
  }, [isPaused, products, maxVisible, getNextProduct]);

  // Initial delay before showing first toast
  useEffect(() => {
    if (isLoading || products.length === 0) return;

    const initialTimeout = setTimeout(() => {
      addEvent();
    }, 3000);

    return () => clearTimeout(initialTimeout);
  }, [addEvent, isLoading, products.length]);

  // Interval for new events
  useEffect(() => {
    if (isLoading || products.length === 0) return;

    const intervalId = setInterval(addEvent, interval);
    return () => clearInterval(intervalId);
  }, [addEvent, interval, isLoading, products.length]);

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  // Don't render if loading or error (graceful degradation)
  if (isLoading || error || products.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-40 flex flex-col gap-2 pointer-events-none',
        positionClasses[position]
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="popLayout">
        {events.map((event) => {
          const Icon = getEventIcon(event.type);
          const colorClass = getEventColor(event.type);

          return (
            <motion.div
              key={event.id}
              layout
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm',
                'bg-white/95 max-w-sm',
                colorClass
              )}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {/* Icon */}
              <div className={cn('p-2 rounded-full', colorClass)}>
                <Icon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {event.message}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                  {event.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {event.location}
                    </span>
                  )}
                  {event.userName && (
                    <span>by {event.userName}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {event.timeAgo}
                  </span>
                </div>
              </div>

              {/* Product Image (if available) */}
              {event.productImage && (
                <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                  <Image
                    src={event.productImage}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Scarcity indicator for low stock items
interface ScarcityIndicatorProps {
  stockCount: number;
  threshold?: number;
  className?: string;
}

export function ScarcityIndicator({
  stockCount,
  threshold = 5,
  className,
}: ScarcityIndicatorProps) {
  if (stockCount > threshold) return null;

  const urgencyLevel = stockCount <= 2 ? 'critical' : stockCount <= threshold ? 'high' : 'medium';

  const configs = {
    critical: {
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: '🚨',
      message: `Only ${stockCount} left!`,
      pulse: true,
    },
    high: {
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      icon: '⚡',
      message: `Only ${stockCount} remaining`,
      pulse: true,
    },
    medium: {
      color: 'text-orange-600 bg-orange-50 border-orange-200',
      icon: '📦',
      message: `${stockCount} left in stock`,
      pulse: false,
    },
  };

  const config = configs[urgencyLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
        config.color,
        config.pulse && 'animate-pulse',
        className
      )}
      role="alert"
    >
      <span>{config.icon}</span>
      <span>{config.message}</span>
    </motion.div>
  );
}

// Live viewer count
interface LiveViewerCountProps {
  count: number;
  className?: string;
}

export function LiveViewerCount({ count, className }: LiveViewerCountProps) {
  if (count < 3) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-blue-50 text-blue-700 border border-blue-200',
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
      </span>
      <span>{count} viewing now</span>
    </motion.div>
  );
}
