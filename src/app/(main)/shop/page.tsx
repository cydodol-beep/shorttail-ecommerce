'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search, Filter, PawPrint, Star, ShoppingBag,
  Truck, Shield, Clock, Award, Zap, SlidersHorizontal, X, ChevronDown,
  TrendingUp, Percent
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
    sales_count?: number
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 24;
  const addItem = useCartStore((state) => state.addItem);
  const { getActiveCategories } = useCategories();
  const categories = getActiveCategories();
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [productRatings, setProductRatings] = useState<Map<string, { avg: number; count: number }>>(new Map());

  const abortControllerRef = useRef<AbortController | null>(null);const { promotions } = useActivePromotions();
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

  {}
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
          product_variants(id, stock_quantity)
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

      if (selectedCondition !== 'all') {
        query = query.eq('condition', selectedCondition);
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else if (sortBy === 'price-asc') {
        query = query.order('base_price', { ascending: true });
      } else if (sortBy === 'price-desc') {
        query = query.order('base_price', { ascending: false });
      } else if (sortBy === 'name-asc') {
        query = query.order('name', { ascending: true });
      } else if (sortBy === 'rating') {
        query = query.order('name', { ascending: true });
      } else if (sortBy === 'bestsellers') {
        query = query.order('name', { ascending: true });
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
        sales_count?: number
      })[] = (data || []).map(p => ({
        ...p,
        avg_rating: productRatings.get(p.id)?.avg || 0,
        total_reviews: productRatings.get(p.id)?.count || 0,
        sales_count: Math.floor(Math.random() * 1000) 
      })) as any;

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

      if (sortBy === 'rating') {
        processedData.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
      } else if (sortBy === 'bestsellers') {
        processedData.sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0));
      }

      clearTimeout(timeoutId);
      setProducts(processedData);
      setTotalCount(count || 0);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name !== 'AbortError' && !error.message?.includes('abort')) {
        console.error('Error fetching products:', error);
      }
    } finally {
      setLoading(false);
    }
  }, [category, sortBy, debouncedSearch, currentPage, itemsPerPage, selectedCondition, productRatings]);

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

  const getProductPrice = (product: Product & { product_variants?: ProductVariant[] }) => {
    if (product.has_variants && product.product_variants && product.product_variants.length > 0) {
      const prices = product.product_variants.map(v => v.price_adjustment || 0);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return { min, max, isRange: min !== max };
    }
    return { min: product.base_price, max: product.base_price, isRange: false };
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
      {}

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

      {}
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
                  <Filter className="h-4 w-4 mr-2" />
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

      {}
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
                    {}
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

                    {}
                    <div>
                      <h4 className="font-semibold text-sm mb-3">Condition</h4>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="condition"
                            value="all"
                            checked={selectedCondition === 'all'}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm">All</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="condition"
                            value="new"
                            checked={selectedCondition === 'new'}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm">New</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="condition"
                            value="secondhand"
                            checked={selectedCondition === 'secondhand'}
                            onChange={(e) => setSelectedCondition(e.target.value)}
                            className="w-4 h-4 text-primary"
                          />
                          <span className="text-sm">Secondhand</span>
                        </label>
                      </div>
                    </div>

                    <Separator />

                    {}
                    <div className="pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setCategory('all');
                          setSearchQuery('');
                          setSelectedCondition('all');
                          setSortBy('newest');
                          setCurrentPage(1);
                        }}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </aside>

            {}
            <div className="flex-1">
              {}
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-brown-600">
                  {totalCount > 0 ? (
                    <>
                      Showing <span className="font-semibold">{((currentPage - 1) * itemsPerPage) + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalCount)}</span> of{' '}
                      <span className="font-semibold">{totalCount}</span> products
                    </>
                  ) : (
                    'No products found'
                  )}
                </p>
              </div>

              {}
              {loading ? (
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
              ) : products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <PawPrint className="h-20 w-20 text-brown-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-brown-900 mb-2">No products found</h3>
                  <p className="text-brown-600 mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchQuery('');
                      setCategory('all');
                      setSelectedCondition('all');
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <>
                  <motion.div 
                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {products.map((product, index) => {
                      const outOfStock = isOutOfStock(product as Product & { product_variants?: ProductVariant[] });
                      const stock = getProductStock(product as Product & { product_variants?: ProductVariant[] });
                      const priceInfo = getProductPrice(product as Product & { product_variants?: ProductVariant[] });
                      const isLowStock = stock <= 5 && stock > 0;
                      const avgRating = product.avg_rating || 0;
                      const totalReviews = product.total_reviews || 0;
                      
                      return (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className={`group transition-all duration-300 h-full flex flex-col relative overflow-hidden ${
                            outOfStock 
                              ? 'border-red-200 opacity-80' 
                              : 'border-brown-200 hover:shadow-xl hover:-translate-y-1'
                          }`}>
                            {}
                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                              {index < 3 && !outOfStock && sortBy === 'bestsellers' && (
                                <Badge className="bg-orange-500 hover:bg-orange-500 text-xs shadow-lg">
                                  #{index + 1} Best Seller
                                </Badge>
                              )}
                              {outOfStock && (
                                <Badge variant="destructive" className="text-xs shadow-lg">
                                  Out of Stock
                                </Badge>
                              )}
                              {product.condition === 'secondhand' && (
                                <Badge variant="secondary" className="text-xs shadow-lg">
                                  Secondhand
                                </Badge>
                              )}
                            </div>

                            <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
                              <Link href={`/products/${product.id}`} className="block">
                                <div className={`aspect-square bg-gradient-to-br from-brown-50 to-brown-100 rounded-xl mb-3 flex items-center justify-center overflow-hidden ${
                                  outOfStock ? 'opacity-60' : ''
                                }`}>
                                  {product.main_image_url ? (
                                    <img
                                      src={product.main_image_url}
                                      alt={product.name}
                                      className={`w-full h-full object-cover transition-transform duration-500 ${
                                        outOfStock ? 'grayscale' : 'group-hover:scale-110'
                                      }`}
                                      loading="lazy"
                                    />
                                  ) : (
                                    <PawPrint className="h-16 w-16 text-brown-300" />
                                  )}
                                </div>
                              </Link>
                              
                              {}
                              <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star} 
                                    className={`h-3 w-3 ${
                                      avgRating >= star 
                                        ? 'fill-yellow-400 text-yellow-400' 
                                        : outOfStock 
                                          ? 'fill-gray-300 text-gray-300' 
                                          : 'text-gray-300'
                                    }`} 
                                  />
                                ))}
                                {totalReviews > 0 && (
                                  <span className="text-[10px] text-brown-500 ml-1">({totalReviews})</span>
                                )}
                              </div>
                              
                              <Link href={`/products/${product.id}`} className="flex-grow">
                                <h3 className={`font-semibold mb-1 transition-colors line-clamp-2 text-sm leading-tight ${
                                  outOfStock ? 'text-gray-500' : 'text-brown-900 group-hover:text-primary'
                                }`}>
                                  {product.name}
                                </h3>
                              </Link>
                              
                              {product.categories && (
                                <p className="text-xs text-brown-600 mb-2 capitalize">
                                  {product.categories.name}
                                </p>
                              )}
                              
                              <div className="mt-auto">
                                <div className="mb-3">
                                  {priceInfo.isRange ? (
                                    <p className={`font-bold text-base ${outOfStock ? 'text-gray-400' : 'text-primary'}`}>
                                      {formatPrice(priceInfo.min)} - {formatPrice(priceInfo.max)}
                                    </p>
                                  ) : (
                                    <p className={`font-bold text-base ${outOfStock ? 'text-gray-400' : 'text-primary'}`}>
                                      {formatPrice(priceInfo.min)}
                                    </p>
                                  )}
                                  {product.has_variants && (
                                    <p className="text-xs text-brown-500">Multiple options</p>
                                  )}
                                  {!outOfStock && isLowStock && (
                                    <p className="text-xs text-red-500 font-medium mt-1">
                                      Only {stock} left!
                                    </p>
                                  )}
                                </div>
                                
                                {outOfStock ? (
                                  <Button
                                    className="w-full h-10 text-xs"
                                    variant="outline"
                                    onClick={() => toast.error('Out of Stock, please contact admin')}
                                  >
                                    Contact
                                  </Button>
                                ) : product.has_variants ? (
                                  <Link href={`/products/${product.id}`}>
                                    <Button
                                      className="w-full h-10 text-xs bg-primary hover:bg-primary/90"
                                    >
                                      View Options
                                    </Button>
                                  </Link>
                                ) : (
                                  <Button
                                    className="w-full h-10 text-xs bg-primary hover:bg-primary/90"
                                    onClick={() => handleAddToCart(product)}
                                  >
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    Add to Cart
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {}
                  <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-brown-600">
                      Page {currentPage} of {Math.ceil(totalCount / itemsPerPage)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      {Array.from({ length: Math.ceil(totalCount / itemsPerPage) }, (_, i) => i + 1)
                        .filter(page => {
                          const totalPages = Math.ceil(totalCount / itemsPerPage);
                          return page === 1 || 
                                 page === totalPages || 
                                 Math.abs(page - currentPage) <= 1;
                        })
                        .map((page, idx, arr) => {
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;
                          
                          return (
                            <div key={page} className="flex gap-2">
                              {showEllipsis && <span className="px-2 py-1">...</span>}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? "bg-primary hover:bg-primary/90" : ""}
                              >
                                {page}
                              </Button>
                            </div>
                          );
                        })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalCount / itemsPerPage), p + 1))}
                        disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-gradient-to-r from-teal/5 via-primary/5 to-accent/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-brown-900 mb-4">
              Why Choose Us?
            </h2>
            <p className="text-lg text-brown-600 max-w-2xl mx-auto">
              We're committed to providing the best products and service for your furry friends
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Truck,
                title: 'Fast & Free Shipping',
                description: allSettings?.shipping?.freeShippingThreshold 
                  ? `Free shipping on orders over Rp ${allSettings.shipping.freeShippingThreshold.toLocaleString()}`
                  : 'Fast and reliable delivery across Indonesia'
              },
              {
                icon: Shield,
                title: 'Quality Guarantee',
                description: 'All products are vet-approved and quality-checked for your peace of mind.'
              },
              {
                icon: Clock,
                title: '24/7 Support',
                description: 'Our team is here to help you anytime with any questions or concerns.'
              },
              {
                icon: Award,
                title: 'Best Prices',
                description: 'Competitive pricing with regular discounts and loyalty rewards.'
              }
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
