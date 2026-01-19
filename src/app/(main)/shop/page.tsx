'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, PawPrint, Star, ShoppingBag,
  Truck, Shield, Clock, Award, Zap, SlidersHorizontal, X, ChevronDown,
  TrendingUp, Percent, Minus, Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { useCategories } from '@/hooks/use-categories';
import { useActivePromotions } from '@/hooks/use-active-promotions';
import { useLandingSections } from '@/hooks/use-landing-sections';
import { useAllSettings } from '@/hooks/use-store-settings';
import type { Product, ProductVariant } from '@/types/database';
import { toast } from 'sonner';

export const dynamic = 'force-dynamic';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'bestsellers', label: 'Best Sellers' },
  { value: 'rating', label: 'Top Rated' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function ShopPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<(Product & {
    categories?: { id: string; name: string; slug: string } | null,
    product_variants?: ProductVariant[],
    avg_rating?: number,
    total_reviews?: number,
    sales_count?: number,
    calculatedMinPrice?: number,
    calculatedMaxPrice?: number
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 24;
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(999999999);
  const addItem = useCartStore((state) => state.addItem);
  const { getActiveCategories } = useCategories();
  const categories = getActiveCategories();
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [productRatings, setProductRatings] = useState<Map<string, { avg: number; count: number }>>(new Map());

  const abortControllerRef = useRef<AbortController | null>(null);
  const { promotions } = useActivePromotions();
  const { getSectionSettings } = useLandingSections();
  const { settings: allSettings } = useAllSettings();

  const categoryFromUrl = searchParams.get('category') || 'all';
  const [category, setCategory] = useState(categoryFromUrl);

  useEffect(() => {
    setCategory(categoryFromUrl);
    setCurrentPage(1);
  }, [categoryFromUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const fetchProductRatings = async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('reviews')
          .select('product_id, rating')
          .eq('is_approved', true);

        if (error) {
          console.error('Error fetching reviews:', error);
          return;
        }

        const ratingsMap = new Map<string, { avg: number; count: number }>();
        const productReviews: Record<string, number[]> = {};

        (data || []).forEach((review: any) => {
          if (!productReviews[review.product_id]) {
            productReviews[review.product_id] = [];
          }
          productReviews[review.product_id].push(review.rating);
        });

        Object.keys(productReviews).forEach(productId => {
          const ratings = productReviews[productId];
          const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          ratingsMap.set(productId, { avg, count: ratings.length });
        });

        setProductRatings(ratingsMap);
      } catch (error) {
        console.error('Error fetching product ratings:', error);
      }
    };

    fetchProductRatings();
  }, []);

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const timeoutId = setTimeout(() => abortController.abort(), 30000);

    try {
      const supabase = createClient();
      let categoryId: string | null = null;

      if (category && category !== 'all') {
        try {
          const { data: catData } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', category)
            .maybeSingle()
            .abortSignal(abortController.signal);

          if (catData) {
            categoryId = catData.id;
          }
        } catch (catError) {
          console.error('Error fetching category ID:', catError);
        }
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          base_price,
          stock_quantity,
          main_image_url,
          has_variants,
          category_id,
          is_active,
          condition,
          created_at,
          product_variants(id, price_adjustment, stock_quantity)
        `, { count: 'exact' })
        .eq('is_active', true)
        .abortSignal(abortController.signal);

      if (from >= 0 && to >= from) {
        query = query.range(from, to);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      if (debouncedSearch) {
        query = query.ilike('name', `%${debouncedSearch}%`);
      }

      const result = await query;

      const data = result.data as (Product & { product_variants?: ProductVariant[] })[] | null;
      const error = result.error;
      const count = result.count;

      if (error) {
        if (error.name !== 'AbortError' && !error.message?.includes('abort')) {
          console.error('Error fetching products:', error);
        }
        clearTimeout(timeoutId);
        setLoading(false);
        return;
      }

      let processedData: (Product & {
        categories?: { id: string; name: string; slug: string } | null,
        product_variants?: ProductVariant[],
        avg_rating?: number,
        total_reviews?: number,
        sales_count?: number,
        calculatedMinPrice?: number,
        calculatedMaxPrice?: number
      })[] = (data || []).map(p => {
        let minPrice = p.base_price;
        let maxPrice = p.base_price;

        if (p.has_variants && p.product_variants && p.product_variants.length > 0) {
          const variantPrices = p.product_variants.map(v => p.base_price + (v.price_adjustment || 0));
          minPrice = Math.min(...variantPrices);
          maxPrice = Math.max(...variantPrices);
        }

        return {
          ...p,
          avg_rating: productRatings.get(p.id)?.avg || 0,
          total_reviews: productRatings.get(p.id)?.count || 0,
          sales_count: Math.floor(Math.random() * 1000),
          calculatedMinPrice: minPrice,
          calculatedMaxPrice: maxPrice
        };
      }) as any;

      if (processedData.length > 0 && data) {
        const categoryIds = [...new Set(data.filter((p: Product) => p.category_id).map((p: Product) => p.category_id))];

        if (categoryIds.length > 0) {
          try {
            const { data: categoriesData } = await supabase
              .from('categories')
              .select('id, name, slug')
              .in('id', categoryIds)
              .abortSignal(abortController.signal);

            if (categoriesData) {
              const categoriesMap = new Map(categoriesData.map((cat: any) => [cat.id, cat]));

              processedData = processedData.map((product: any) => ({
                ...product,
                categories: product.category_id ? categoriesMap.get(product.category_id) as { id: string; name: string; slug: string } | undefined : null
              }));
            }
          } catch (categoriesError) {
            console.error('Error fetching categories:', categoriesError);
          }
        }
      }

      clearTimeout(timeoutId);

      let filteredData = [...processedData];

      if (minPrice > 0 || maxPrice < 999999999) {
        filteredData = filteredData.filter(p => {
          const min = p.calculatedMinPrice || 0;
          const max = p.calculatedMaxPrice || 0;

          return min >= minPrice && max <= maxPrice;
        });
      }

      if (sortBy === 'newest') {
        filteredData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else if (sortBy === 'price-asc') {
        filteredData.sort((a, b) => (a.calculatedMinPrice || 0) - (b.calculatedMinPrice || 0));
      } else if (sortBy === 'price-desc') {
        filteredData.sort((a, b) => (b.calculatedMaxPrice || 0) - (a.calculatedMaxPrice || 0));
      } else if (sortBy === 'name-asc') {
        filteredData.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortBy === 'rating') {
        filteredData.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      } else if (sortBy === 'bestsellers') {
        filteredData.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      }

      setProducts(filteredData);
      setTotalCount(filteredData.length);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name !== 'AbortError' && !error.message?.includes('abort')) {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [category, sortBy, debouncedSearch, currentPage, itemsPerPage, minPrice, maxPrice, productRatings]);

  useEffect(() => {
    fetchProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [fetchProducts]);

  const getProductPrice = (product: Product & {
    product_variants?: ProductVariant[],
    calculatedMinPrice?: number,
    calculatedMaxPrice?: number
  }) => {
    const min = product.calculatedMinPrice || 0;
    const max = product.calculatedMaxPrice || 0;

    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      return { min, max, isRange: min !== max };
    }

    return { min, max, isRange: false };
  };

  const getProductStock = (product: Product & { product_variants?: ProductVariant[] }) => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      const variantStock = product.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      return variantStock + product.stock_quantity;
    }
    return product.stock_quantity;
  };

  const isOutOfStock = (product: Product & { product_variants?: ProductVariant[] }) => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      const hasAnyVariantInStock = product.product_variants.some(variant => variant.stock_quantity > 0);
      return !hasAnyVariantInStock && product.stock_quantity <= 0;
    }
    return product.stock_quantity <= 0;
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream to-white">

      {promotions.length > 1 && (
        <section className="bg-gradient-to-r from-orange-500 to-red-500 py-4 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-6 text-white">
              {promotions.slice(0, 2).map((promo, index) => (
                <div key={promo.id} className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  <span className="font-semibold">{promo.formattedDiscount}</span>
                  {index < promotions.slice(0, 2).length - 1 && <Separator orientation="vertical" className="h-6 bg-white/30" />}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-8 sm:py-12 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <form className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </form>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[180px] h-12">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.slug} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="lg"
                className="lg:hidden h-12"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {}
            <aside className={`lg:w-64 lg:shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-brown-900">Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="lg:hidden"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Categories</h4>
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="category"
                              value="all"
                              checked={category === 'all'}
                              onChange={(e) => setCategory(e.target.value)}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm">All Categories</span>
                          </label>
                          {categories.map((cat) => (
                            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name="category"
                                value={cat.slug}
                                checked={category === cat.slug}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-4 h-4 text-primary"
                              />
                              <span className="text-sm">{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold text-sm mb-3">Price Range (Rp)</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-muted-foreground">
                            {minPrice === 0 ? 'No minimum' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(minPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {maxPrice === 999999999 ? 'No maximum' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(maxPrice)}
                          </span>
                        </div>
                        <Slider
                          defaultValue={[minPrice, maxPrice]}
                          value={[minPrice, maxPrice]}
                          min={0}
                          max={999999999}
                          step={10000}
                          onValueChange={(values: number[]) => {
                            setMinPrice(values[0]);
                            setMaxPrice(values[1]);
                          }}
                          className="w-full"
                        />
                        <Button
                          onClick={() => {
                            setMinPrice(0);
                            setMaxPrice(999999999);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>
                        <Button
                          onClick={() => {
                            setMinPrice(0);
                            setMaxPrice(999999999);
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Reset
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                         onClick={() => {
                           setCategory('all');
                           setSearchQuery('');
                           setMinPrice(0);
                           setMaxPrice(999999999);
                           setSortBy('newest');
                           setCurrentPage(1);
                         }}
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-brown-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-brown-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-cream to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Skeleton className="h-24 w-96 mx-auto mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-brown-200">
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="aspect-square rounded-xl mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-5 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  );
}
