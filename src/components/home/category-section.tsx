'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { PawPrint, FolderOpen, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import { Skeleton } from '@/components/ui/skeleton';
import { useLandingSections } from '@/hooks/use-landing-sections';

// Gradient colors for category cards
const categoryGradients = [
  'from-[#ff911d]/20 to-[#ff911d]/5',
  'from-[#006d77]/20 to-[#006d77]/5',
  'from-pink-500/20 to-pink-500/5',
  'from-purple-500/20 to-purple-500/5',
  'from-blue-500/20 to-blue-500/5',
  'from-green-500/20 to-green-500/5',
  'from-amber-500/20 to-amber-500/5',
  'from-rose-500/20 to-rose-500/5',
];

const categoryIconColors = [
  'text-[#ff911d]',
  'text-[#006d77]',
  'text-pink-500',
  'text-purple-500',
  'text-blue-500',
  'text-green-500',
  'text-amber-500',
  'text-rose-500',
];

export function CategorySection() {
  const { getActiveCategories, loading } = useCategories();
  const categories = getActiveCategories();

  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('categories', {
    title: 'Shop by Category',
    subtitle: 'Find What Your Pet Needs',
  });

  if (loading) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-brown-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <Skeleton className="h-5 w-32 mx-auto mb-3" />
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm">
                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-5 w-24 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-brown-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-brown-100 rounded-2xl flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-brown-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-brown-900 mb-2">No Categories Yet</h2>
            <p className="text-brown-600 text-sm">Check back soon for our product categories</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 sm:py-20 bg-gradient-to-b from-white to-brown-50/50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4"
          >
            <Sparkles className="h-4 w-4" />
            <span>{settings.subtitle}</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-brown-900"
          >
            {settings.title}
          </motion.h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => {
            const gradientClass = categoryGradients[index % categoryGradients.length];
            const iconColorClass = categoryIconColors[index % categoryIconColors.length];
            
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Link href={`/products?category=${category.slug}`}>
                  <div className={`
                    relative bg-gradient-to-br ${gradientClass} 
                    rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8
                    cursor-pointer group
                    border border-white/50 backdrop-blur-sm
                    hover:shadow-xl hover:shadow-primary/10
                    hover:-translate-y-1
                    transition-all duration-300 ease-out
                  `}>
                    {/* Decorative corner accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 opacity-30">
                      <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-current ${iconColorClass}`} />
                      <div className={`absolute top-3 right-7 w-1.5 h-1.5 rounded-full bg-current ${iconColorClass} opacity-60`} />
                      <div className={`absolute top-7 right-3 w-1 h-1 rounded-full bg-current ${iconColorClass} opacity-40`} />
                    </div>

                    {/* Category Icon/Image */}
                    <div className="relative mb-4 sm:mb-5">
                      <div className={`
                        mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24
                        bg-white rounded-2xl sm:rounded-3xl
                        flex items-center justify-center
                        shadow-lg shadow-black/5
                        group-hover:scale-105 group-hover:shadow-xl
                        transition-all duration-300
                        overflow-hidden
                      `}>
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <PawPrint className={`h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 ${iconColorClass}`} />
                        )}
                      </div>
                    </div>

                    {/* Category Name */}
                    <div className="text-center">
                      <h3 className="font-bold text-brown-900 text-sm sm:text-base lg:text-lg group-hover:text-primary transition-colors duration-300">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-brown-600 text-xs sm:text-sm mt-1 line-clamp-2 hidden sm:block">
                          {category.description}
                        </p>
                      )}
                    </div>

                    {/* Hover Arrow Indicator */}
                    <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white shadow-md flex items-center justify-center`}>
                        <ArrowRight className={`h-3 w-3 sm:h-4 sm:w-4 ${iconColorClass}`} />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10 sm:mt-12"
        >
          <Link href="/products">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
            >
              Browse All Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
