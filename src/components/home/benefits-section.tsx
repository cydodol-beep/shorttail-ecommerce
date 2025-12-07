'use client';

import { Truck, Shield, CreditCard, Headphones, RotateCcw, Award, Package, Heart, Star, Gift } from 'lucide-react';
import { useLandingSections } from '@/hooks/use-landing-sections';

// Icon mapping
const iconMap: Record<string, any> = {
  truck: Truck,
  shield: Shield,
  card: CreditCard,
  headphones: Headphones,
  rotate: RotateCcw,
  award: Award,
  package: Package,
  heart: Heart,
  star: Star,
  gift: Gift,
};

// Default benefits
const defaultBenefits = [
  { icon: 'truck', title: 'Fast Delivery', description: '2-3 days delivery', color: 'bg-green-100 text-green-600' },
  { icon: 'shield', title: 'Secure Payment', description: 'Protected transactions', color: 'bg-blue-100 text-blue-600' },
  { icon: 'card', title: 'Multiple Payment', description: 'Various methods', color: 'bg-purple-100 text-purple-600' },
  { icon: 'headphones', title: '24/7 Support', description: 'Ready to help anytime', color: 'bg-orange-100 text-orange-600' },
  { icon: 'rotate', title: 'Easy Returns', description: '7-day return policy', color: 'bg-red-100 text-red-600' },
  { icon: 'award', title: 'Quality Guarantee', description: '100% authentic products', color: 'bg-yellow-100 text-yellow-600' },
];

export function BenefitsSection() {
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('benefits', { benefits: defaultBenefits });
  
  const benefits = settings.benefits || defaultBenefits;

  return (
    <section className="py-12 bg-white border-y border-brown-100">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {benefits.map((benefit: any, index: number) => {
            const IconComponent = iconMap[benefit.icon] || Package;
            return (
              <div 
                key={index}
                className="flex flex-col items-center text-center group"
              >
                <div className={`p-4 rounded-2xl ${benefit.color} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-brown-900 text-sm mb-1">
                  {benefit.title}
                </h3>
                <p className="text-xs text-brown-500">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
