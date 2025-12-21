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
    subtitle: 'Pet Categories',
  });

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-accent font-bold uppercase tracking-wider text-sm mb-2 block">{settings.subtitle}</span>
            <h2 className="text-3xl md:text-4xl font-bold text-teal">{settings.title}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border border-teal/20">
                <CardContent className="p-6 text-center">
                  <Skeleton className="w-16 h-16 mx-auto mb-4 rounded-full" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-4 bg-cream rounded-full flex items-center justify-center">
              <FolderOpen className="h-10 w-10 text-teal/50" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-teal mb-2">No Categories Yet</h2>
            <p className="text-teal/70 text-sm">Check back soon for our product categories</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-accent font-bold uppercase tracking-wider text-sm mb-2 block">{settings.subtitle}</span>
          <h2 className="text-3xl md:text-4xl font-bold text-teal">{settings.title}</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/products?category=${category.slug}`}>
              <div className="bg-cream rounded-2xl p-6 text-center cursor-pointer hover:bg-accent/10 transition-colors group">
                <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:shadow-md transition-shadow">
                  {category.image_url ? (
                    <img
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <PawPrint className="h-8 w-8 text-teal" />
                  )}
                </div>
                <h3 className="font-bold text-teal group-hover:text-accent">{category.name}</h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Link href="/products">
            <Button variant="outline" className="w-full sm:w-auto border-teal text-teal hover:bg-teal hover:text-white">
              View All Categories
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
