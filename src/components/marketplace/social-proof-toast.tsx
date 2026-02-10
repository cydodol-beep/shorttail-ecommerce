'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MapPin, Clock, Users, Star, TrendingUp } from 'lucide-react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface SocialProofEvent {
  id: string;
  type: 'purchase' | 'view' | 'cart' | 'review';
  message: string;
  location?: string;
  timeAgo: string;
  productImage?: string;
  userName?: string;
}

// Simulated social proof data
const mockEvents: Omit<SocialProofEvent, 'id' | 'timeAgo'>[] = [
  { type: 'purchase', message: 'Someone bought Premium Dog Food', location: 'Jakarta', productImage: '' },
  { type: 'purchase', message: 'Cat Toy Bundle purchased', location: 'Surabaya', productImage: '' },
  { type: 'cart', message: '5 people added Organic Cat Treats to cart' },
  { type: 'view', message: '12 people viewing Dog Bed Premium now' },
  { type: 'review', message: 'Ani gave Cat Scratching Post 5 stars', userName: 'Ani' },
  { type: 'purchase', message: 'Aquarium Filter purchased', location: 'Bandung', productImage: '' },
  { type: 'view', message: '8 people viewing Bird Cage Large now' },
  { type: 'purchase', message: 'Leather Dog Collar bought', location: 'Yogyakarta', productImage: '' },
];

interface SocialProofToastProps {
  interval?: number;
  maxVisible?: number;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

function getTimeAgo(): string {
  const times = ['Just now', '1 min ago', '2 mins ago', '3 mins ago', '5 mins ago'];
  return times[Math.floor(Math.random() * times.length)];
}

function generateEvent(): SocialProofEvent {
  const baseEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
  return {
    ...baseEvent,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timeAgo: getTimeAgo(),
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
  interval = 8000,
  maxVisible = 2,
  position = 'bottom-left',
}: SocialProofToastProps) {
  const [events, setEvents] = useState<SocialProofEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // Add new event
  const addEvent = useCallback(() => {
    if (isPaused) return;

    setEvents((prev) => {
      const newEvent = generateEvent();
      const updated = [newEvent, ...prev].slice(0, maxVisible);
      return updated;
    });

    // Remove event after display duration
    setTimeout(() => {
      setEvents((prev) => prev.slice(0, -1));
    }, 5000);
  }, [isPaused, maxVisible]);

  // Initial delay before showing first toast
  useEffect(() => {
    const initialTimeout = setTimeout(() => {
      addEvent();
    }, 3000);

    return () => clearTimeout(initialTimeout);
  }, [addEvent]);

  // Interval for new events
  useEffect(() => {
    const intervalId = setInterval(addEvent, interval);
    return () => clearInterval(intervalId);
  }, [addEvent, interval]);

  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

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
