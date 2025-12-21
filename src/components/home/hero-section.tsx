'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Truck,
  Shield,
  Gift,
  Clock,
  Award,
  Heart,
  Star,
  Check,
  Zap,
  Package,
  Phone,
  Mail,
  Headphones,
  LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAllSettings } from '@/hooks/use-store-settings';
import { useLandingSections } from '@/hooks/use-landing-sections';
import { motion } from 'framer-motion';

// Icon mapping for trust badges
const iconMap: Record<string, LucideIcon> = {
  truck: Truck,
  shield: Shield,
  clock: Clock,
  gift: Gift,
  award: Award,
  heart: Heart,
  star: Star,
  check: Check,
  zap: Zap,
  package: Package,
  phone: Phone,
  mail: Mail,
  headphones: Headphones,
};

// Auto-detect icon based on text keywords
function getIconFromText(text: string): LucideIcon {
  const lowerText = text.toLowerCase();

  if (lowerText.includes('delivery') || lowerText.includes('shipping') || lowerText.includes('kirim')) return Truck;
  if (lowerText.includes('secure') || lowerText.includes('safe') || lowerText.includes('aman')) return Shield;
  if (lowerText.includes('support') || lowerText.includes('help') || lowerText.includes('bantuan')) return Headphones;
  if (lowerText.includes('24/7') || lowerText.includes('time') || lowerText.includes('hours')) return Clock;
  if (lowerText.includes('gift') || lowerText.includes('bonus') || lowerText.includes('hadiah')) return Gift;
  if (lowerText.includes('quality') || lowerText.includes('premium') || lowerText.includes('berkualitas')) return Award;
  if (lowerText.includes('guarantee') || lowerText.includes('warranty') || lowerText.includes('garansi')) return Check;
  if (lowerText.includes('fast') || lowerText.includes('quick') || lowerText.includes('cepat')) return Zap;
  if (lowerText.includes('phone') || lowerText.includes('call') || lowerText.includes('telepon')) return Phone;
  if (lowerText.includes('email') || lowerText.includes('mail')) return Mail;
  if (lowerText.includes('love') || lowerText.includes('care') || lowerText.includes('cinta')) return Heart;
  if (lowerText.includes('star') || lowerText.includes('rating') || lowerText.includes('review')) return Star;
  if (lowerText.includes('package') || lowerText.includes('box') || lowerText.includes('paket')) return Package;

  return Shield; // Default icon
}

export function HeroSection() {
  const { settings: allSettings } = useAllSettings();
  const store = allSettings?.store;
  const shipping = allSettings?.shipping;

  const { sections, fetched, getSectionSettings } = useLandingSections();

  // Get hero settings with proper defaults that will be overridden by DB settings
  const heroSettings = getSectionSettings('hero', {
    title: 'Everything Your Pet Needs & Loves',
    subtitle: '',
    showTrustBadges: true,
    trustBadges: [
      { text: 'Fast Delivery', icon: 'truck' },
      { text: 'Secure Payment', icon: 'shield' },
      { text: '24/7 Support', icon: 'clock' },
    ],
  });

  return (
    <section className="relative bg-gradient-to-br from-cream via-white to-teal/10 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-teal rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-6 text-center lg:text-left order-2 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal/10 text-teal px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm">
              <Gift className="h-3 w-3 sm:h-4 sm:w-4" />
              {shipping?.freeShippingEnabled
                ? `Free Shipping over ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(shipping.freeShippingThreshold)}`
                : 'Premium Pet Products'
              }
            </div>

            {/* Main Heading - Mobile Optimized */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-teal leading-tight">
              {heroSettings.title.includes(' ') ? (
                <>
                  {heroSettings.title.split(' ').slice(0, -2).join(' ')}{' '}
                  <span className="text-accent">{heroSettings.title.split(' ').slice(-2).join(' ')}</span>
                </>
              ) : (
                heroSettings.title
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-teal/70 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {heroSettings.subtitle || store?.storeDescription || 'Discover premium quality food, toys, accessories, and more for your beloved pets. Shop now and give them the best!'}
            </p>

            {/* CTA Buttons - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
              <Link href="/products">
                <Button size="lg" className="text-base shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto bg-accent hover:bg-accent-hover">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/products?category=new-arrivals">
                <Button size="lg" variant="outline" className="text-base w-full sm:w-auto border-teal text-teal hover:bg-teal hover:text-white">
                  New Arrivals
                </Button>
              </Link>
            </div>

            {/* Trust Badges - Mobile Optimized */}
            {heroSettings.showTrustBadges && heroSettings.trustBadges && (
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-3 sm:gap-6 justify-center lg:justify-start pt-2 sm:pt-4">
                {heroSettings.trustBadges.map((badge: { text: string; icon?: string }, index: number) => {
                  // Get icon from mapping or auto-detect from text
                  const IconComponent = badge.icon && iconMap[badge.icon]
                    ? iconMap[badge.icon]
                    : getIconFromText(badge.text);

                  // Color variations for badges
                  const colors = [
                    { bg: 'bg-green-100', text: 'text-green-600' },
                    { bg: 'bg-blue-100', text: 'text-blue-600' },
                    { bg: 'bg-orange-100', text: 'text-orange-600' },
                    { bg: 'bg-purple-100', text: 'text-purple-600' },
                    { bg: 'bg-pink-100', text: 'text-pink-600' },
                    { bg: 'bg-yellow-100', text: 'text-yellow-600' },
                  ];
                  const color = colors[index % colors.length];

                  return (
                    <div key={index} className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-teal/70">
                      <div className={`p-1.5 sm:p-2 ${color.bg} rounded-full shrink-0`}>
                        <IconComponent className={`h-3 w-3 sm:h-4 sm:w-4 ${color.text}`} />
                      </div>
                      <span className="text-center sm:text-left">{badge.text}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Content - Hero Image - Mobile Optimized */}
          <div className="relative order-1 lg:order-2">
            <div className="relative aspect-square max-w-[280px] sm:max-w-md lg:max-w-lg mx-auto">
              {/* Main Image Container */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal/20 to-accent/5 rounded-2xl sm:rounded-3xl transform rotate-3" />
              <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl overflow-hidden">
                {store?.storeLogo ? (
                  <div className="w-full h-full flex items-center justify-center p-8 sm:p-12">
                    {store.storeLogo.startsWith('data:') ? (
                      <img
                        src={store.storeLogo}
                        alt={store.storeName || 'Store'}
                        className="w-full h-full object-contain"
                        loading="eager"
                      />
                    ) : (
                      <Image
                        src={store.storeLogo}
                        alt={store.storeName || 'Store'}
                        fill
                        className="object-contain p-8 sm:p-12"
                        priority
                      />
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-cream/50 to-cream flex items-center justify-center">
                    <div className="text-center p-6 sm:p-8">
                      <div className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4 bg-teal/10 rounded-full flex items-center justify-center">
                        <Gift className="h-10 w-10 sm:h-16 sm:w-16 text-teal" />
                      </div>
                      <p className="text-teal font-medium text-sm sm:text-base">Premium Pet Shop</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Elements - Hidden on small mobile */}
              <div className="hidden sm:block absolute -top-4 -right-4 bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 animate-bounce">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-base sm:text-xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-teal">4.9/5</p>
                    <p className="text-[10px] sm:text-xs text-teal/600">Rating</p>
                  </div>
                </div>
              </div>

              <div className="hidden sm:block absolute -bottom-4 -left-4 bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-base sm:text-xl">🐾</span>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-teal">1000+</p>
                    <p className="text-[10px] sm:text-xs text-teal/600">Products</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
