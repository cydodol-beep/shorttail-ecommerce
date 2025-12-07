'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, PawPrint, Star, ShoppingBag } from 'lucide-react';

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
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/store/cart-store';
import { useCategories } from '@/hooks/use-categories';
import type { Product, ProductVariant } from '@/types/database';
import { toast } from 'sonner';

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
];

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('newest');
  const addItem = useCartStore((state) => state.addItem);
  const { getActiveCategories } = useCategories();
  const categories = getActiveCategories();
  
  // Get category from URL params - update when URL changes
  const categoryFromUrl = searchParams.get('category') || 'all';
  const [category, setCategory] = useState(categoryFromUrl);
  
  // Sync category state with URL
  useEffect(() => {
    setCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    
    // If category filter is set, get the category ID by slug from database
    let categoryId: string | null = null;
    if (category && category !== 'all') {
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .maybeSingle();
      
      if (!catError && catData) {
        categoryId = catData.id;
      }
    }
    
    let query = supabase
      .from('products')
      .select('*, product_variants(*), categories(id, name, slug)')
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    switch (sortBy) {
      case 'price-asc':
        query = query.order('base_price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('base_price', { ascending: false });
        break;
      case 'name-asc':
        query = query.order('name', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [category, sortBy, searchQuery]);

  useEffect(() => {
    fetchProducts();
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
      // Include both variant stock and base stock
      const variantStock = product.product_variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      return variantStock + product.stock_quantity;
    }
    return product.stock_quantity;
  };

  const isOutOfStock = (product: Product & { product_variants?: ProductVariant[] }) => {
    const stock = getProductStock(product);
    return stock <= 0;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleAddToCart = (product: Product) => {
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900 mb-2">Products</h1>
        <p className="text-brown-600">
          Browse our collection of premium pet supplies
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>
        <div className="flex gap-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
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
            <SelectTrigger className="w-[180px]">
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
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="p-4">
                <Skeleton className="aspect-square rounded-lg mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <PawPrint className="h-16 w-16 text-brown-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-brown-900 mb-2">No products found</h3>
          <p className="text-brown-600 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button onClick={() => { setSearchQuery(''); setCategory('all'); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {products.map((product, index) => {
            const outOfStock = isOutOfStock(product as Product & { product_variants?: ProductVariant[] });
            const stock = getProductStock(product as Product & { product_variants?: ProductVariant[] });
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`group transition-all duration-300 h-full flex flex-col relative ${
                  outOfStock 
                    ? 'border-red-200 opacity-90' 
                    : 'border-brown-200 hover:shadow-lg'
                }`}>
                  {/* Out of Stock Overlay */}
                  {outOfStock && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge variant="destructive" className="font-bold">
                        OUT OF STOCK
                      </Badge>
                    </div>
                  )}
                  
                  <CardContent className="p-4 flex flex-col flex-1">
                    <Link href={`/products/${product.id}`} className="block">
                      <div className={`aspect-square bg-brown-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden ${
                        outOfStock ? 'opacity-60' : ''
                      }`}>
                        {product.main_image_url ? (
                          <img
                            src={product.main_image_url}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              outOfStock ? 'grayscale' : 'group-hover:scale-105'
                            }`}
                          />
                        ) : (
                          <PawPrint className="h-16 w-16 text-brown-300" />
                        )}
                      </div>
                    </Link>
                    
                    {product.condition === 'secondhand' && (
                      <Badge variant="secondary" className="w-fit mb-2">
                        Secondhand
                      </Badge>
                    )}
                    
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`h-4 w-4 ${outOfStock ? 'fill-gray-300 text-gray-300' : 'fill-yellow-400 text-yellow-400'}`} />
                      ))}
                    </div>
                    
                    <Link href={`/products/${product.id}`}>
                      <h3 className={`font-semibold mb-1 transition-colors line-clamp-2 ${
                        outOfStock ? 'text-gray-500' : 'text-brown-900 group-hover:text-primary'
                      }`}>
                        {product.name}
                      </h3>
                    </Link>
                    
                    <p className="text-sm text-brown-600 mb-2 capitalize">{product.category}</p>
                    
                    <div className="mt-auto">
                      {(() => {
                        const priceInfo = getProductPrice(product as Product & { product_variants?: ProductVariant[] });
                        return (
                          <>
                            <div className="mb-3">
                              {priceInfo.isRange ? (
                                <p className={`font-bold text-lg ${outOfStock ? 'text-gray-400' : 'text-primary'}`}>
                                  {formatPrice(priceInfo.min)} - {formatPrice(priceInfo.max)}
                                </p>
                              ) : (
                                <p className={`font-bold text-lg ${outOfStock ? 'text-gray-400' : 'text-primary'}`}>
                                  {formatPrice(priceInfo.min)}
                                </p>
                              )}
                              {product.has_variants && (
                                <p className="text-xs text-brown-500">Multiple variants available</p>
                              )}
                              {!outOfStock && (
                                <p className="text-xs text-green-600 mt-1">Stock: {stock}</p>
                              )}
                            </div>
                            
                            {outOfStock ? (
                              <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => toast.error('Out of Stock, please contact admin')}
                              >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Contact Admin
                              </Button>
                            ) : product.has_variants ? (
                              <Button
                                className="w-full"
                                asChild
                              >
                                <Link href={`/products/${product.id}`}>
                                  View Options
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                className="w-full"
                                onClick={() => handleAddToCart(product)}
                              >
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Add to Cart
                              </Button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-9 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Skeleton className="h-10 flex-1" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="p-4">
                <Skeleton className="aspect-square rounded-lg mb-4" />
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-5 w-full mb-1" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-6 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    }>
      <ProductsPageContent />
    </Suspense>
  );
}
