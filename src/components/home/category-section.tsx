'use client';

import Link from 'next/link';
import { PawPrint, FolderOpen, ArrowRight, Grid3X3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCategories } from '@/hooks/use-categories';
import { Skeleton } from '@/components/ui/skeleton';
import { useLandingSections } from '@/hooks/use-landing-sections';

export function CategorySection() {
  const { getActiveCategories, loading } = useCategories();
  const categories = getActiveCategories();
  
  const { getSectionSettings } = useLandingSections();
  const settings = getSectionSettings('categories', {
    title: 'Shop by Category',
    subtitle: 'Find what you need easily',
  });

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3 justify-center sm:justify-start">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown-900">{settings.title}</h2>
                <p className="text-brown-600 text-xs sm:text-sm">{settings.subtitle}</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="w-full aspect-square mb-2 sm:mb-3 rounded-xl" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-2/3 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-12 sm:py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-brown-100 rounded-full flex items-center justify-center">
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
    <section className="py-12 sm:py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start mb-4 sm:mb-0">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-brown-900">{settings.title}</h2>
              <p className="text-brown-600 text-xs sm:text-sm">{settings.subtitle}</p>
            </div>
          </div>
          <Link href="/products">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Categories Grid - Modern Card Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`}>
              <Card className="group border-2 border-transparent hover:border-primary hover:shadow-lg transition-all duration-300 h-full">
                <CardContent className="p-3 sm:p-4 text-center">
                  {/* Image/Icon Container */}
                  <div className="relative w-full aspect-square mb-2 sm:mb-3 rounded-xl overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary/10 transition-colors">
                        <PawPrint className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" />
                      </div>
                    )}
                  </div>
                  
                  {/* Category Name */}
                  <h3 className="font-semibold text-brown-900 text-xs sm:text-sm lg:text-base group-hover:text-primary transition-colors line-clamp-2">
                    {category.name}
                  </h3>
                  
                  {/* Optional: Product Count */}
                  {category.product_count !== undefined && (
                    <p className="text-[10px] sm:text-xs text-brown-500 mt-1">
                      {category.product_count} products
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="text-center mt-6 sm:mt-8 sm:hidden">
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto">
              Browse All Categories
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
