'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  PawPrint,
  Download,
  Upload,
  FileDown,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { parseProductsFromExcel, exportProductsToExcel, downloadTemplate, type ProductWithVariants } from '@/lib/excel-utils';
import { useCategories } from '@/hooks/use-categories';
import type { Product, ProductVariant } from '@/types/database';
import { toast } from 'sonner';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getActiveCategories, getCategoryBySlug, loading: categoriesLoading } = useCategories();
  const categories = getActiveCategories();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('products')
      .select('id, name, sku, category_id, base_price, stock_quantity, is_active, main_image_url, has_variants, categories(id, name, slug), product_variants(id)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100);

    if (categoryFilter && categoryFilter !== 'all') {
      const selectedCategory = getCategoryBySlug(categoryFilter);
      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to fetch products');
    } else {
      setProducts((data || []) as Product[]);
    }
    setLoading(false);
  }, [categoryFilter, getCategoryBySlug]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    const supabase = createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete product');
    } else {
      toast.success('Product deleted successfully');
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('products')
      .update({ is_active: !isActive })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update product');
    } else {
      toast.success(`Product ${!isActive ? 'activated' : 'deactivated'}`);
      setProducts(
        products.map((p) => (p.id === id ? { ...p, is_active: !isActive } : p))
      );
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = async () => {
    if (products.length === 0) {
      toast.error('No products to export');
      return;
    }
    
    // Fetch products with variants for export
    const supabase = createClient();
    const productIds = products.map((p) => p.id);
    
    const { data: fullProducts, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);
    
    if (productsError) {
      toast.error('Failed to fetch products for export');
      return;
    }
    
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', productIds);
    
    if (variantsError) {
      toast.error('Failed to fetch variants for export');
      return;
    }
    
    // Combine products with their variants
    const productsWithVariants: ProductWithVariants[] = (fullProducts || []).map((product: Product) => ({
      ...product,
      product_variants: (variants || []).filter((v: ProductVariant) => v.product_id === product.id),
    }));
    
    exportProductsToExcel(productsWithVariants, `products_export_${new Date().toISOString().split('T')[0]}`);
    toast.success('Products exported successfully');
  };

  const handleImportClick = () => {
    setImportDialogOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const { products: importedProducts, variants: importedVariants } = await parseProductsFromExcel(file);
      
      if (importedProducts.length === 0) {
        toast.error('No valid products found in file');
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Filter out products without a name
      const validProducts = importedProducts.filter((p) => p.name && p.name.trim() !== '');
      if (validProducts.length === 0) {
        toast.error('No products with valid names found');
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const supabase = createClient();
      
      // Build a map of SKUs that have variants
      const skusWithVariants = new Set(importedVariants.map((v) => v.product_sku));
      
      const productsToInsert = validProducts.map((p) => ({
        name: p.name,
        description: p.description || null,
        sku: p.sku || null,
        category: p.category || null,
        base_price: p.base_price,
        stock_quantity: p.stock_quantity,
        condition: p.condition || 'new',
        unit_weight_grams: p.unit_weight_grams || 0,
        main_image_url: p.main_image_url || null,
        is_active: p.is_active ?? true,
        has_variants: p.sku ? skusWithVariants.has(p.sku) : false,
      }));

      const { data: insertedProducts, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (error) {
        toast.error(`Import failed: ${error.message}`);
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // Insert variants if any
      let variantsInsertedCount = 0;
      if (importedVariants.length > 0 && insertedProducts) {
        // Build a map of SKU to product ID
        const skuToProductId: Record<string, string> = {};
        insertedProducts.forEach((p: Product) => {
          if (p.sku) {
            skuToProductId[p.sku] = p.id;
          }
        });
        
        const variantsToInsert = importedVariants
          .filter((v) => skuToProductId[v.product_sku] && v.variant_name)
          .map((v) => ({
            product_id: skuToProductId[v.product_sku],
            variant_name: v.variant_name,
            sku: v.sku || null,
            variant_image_url: v.variant_image_url || null,
            unit_label: v.unit_label || null,
            weight_grams: v.weight_grams || null,
            price_adjustment: v.price_adjustment,
            stock_quantity: v.stock_quantity,
          }));
        
        if (variantsToInsert.length > 0) {
          const { data: insertedVariants, error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsToInsert)
            .select();
          
          if (variantsError) {
            toast.warning(`Products imported but variants failed: ${variantsError.message}`);
          } else {
            variantsInsertedCount = insertedVariants?.length || 0;
          }
        }
      }

      const message = variantsInsertedCount > 0
        ? `Successfully imported ${insertedProducts.length} products and ${variantsInsertedCount} variants`
        : `Successfully imported ${insertedProducts.length} products`;
      toast.success(message);
      fetchProducts();
      setImportDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse file. Please check the format.';
      toast.error(errorMessage);
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Products</h1>
          <p className="text-brown-600">Manage your product catalog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Link href="/admin/products/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-brown-200 mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter} disabled={categoriesLoading}>
              <SelectTrigger className="w-[180px]" suppressHydrationWarning>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder={categoriesLoading ? "Loading..." : "Category"} />
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
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-brown-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <PawPrint className="h-12 w-12 text-brown-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-brown-900 mb-2">No products found</h3>
              <p className="text-brown-600 mb-4">Get started by adding your first product</p>
              <Link href="/admin/products/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Product</TableHead>
                    <TableHead className="hidden sm:table-cell w-[70px] text-center">Variants</TableHead>
                    <TableHead className="hidden md:table-cell">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="hidden lg:table-cell text-center">Stock</TableHead>
                    <TableHead className="hidden sm:table-cell text-center">Status</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-brown-100 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                            {product.main_image_url ? (
                              <img
                                src={product.main_image_url}
                                alt={product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-brown-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-brown-900 text-sm sm:text-base truncate max-w-[120px] sm:max-w-[180px]">{product.name}</p>
                            <p className="text-xs sm:text-sm text-brown-500 truncate">{product.sku || 'No SKU'}</p>
                            {/* Mobile: Show variants, category, stock inline */}
                            <div className="flex flex-wrap gap-1 mt-1 sm:hidden">
                              {(product as any).has_variants && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">
                                  {(product as any).product_variants?.length || 0} var
                                </Badge>
                              )}
                              <Badge 
                                variant={product.stock_quantity > 10 ? 'default' : product.stock_quantity > 0 ? 'secondary' : 'destructive'}
                                className="text-[10px] px-1 py-0"
                              >
                                {product.stock_quantity} stk
                              </Badge>
                              <Badge 
                                variant={product.is_active ? 'default' : 'secondary'}
                                className="text-[10px] px-1 py-0"
                              >
                                {product.is_active ? '✓' : '✗'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        {(product as any).has_variants ? (
                          <Badge variant="outline" className="font-medium text-xs">
                            {(product as any).product_variants?.length || 0}
                          </Badge>
                        ) : (
                          <span className="text-brown-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize text-sm">{(product as any).categories?.name || '-'}</TableCell>
                      <TableCell className="text-sm">{formatPrice(product.base_price)}</TableCell>
                      <TableCell className="hidden lg:table-cell text-center">
                        <Badge
                          variant={product.stock_quantity > 10 ? 'default' : product.stock_quantity > 0 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {product.stock_quantity}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-center">
                        <Badge variant={product.is_active ? 'default' : 'secondary'} className="text-xs">
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(product.id, product.is_active)}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(product.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Products</DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) or CSV file to import products in bulk.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-brown-200 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 text-brown-400 mx-auto mb-4" />
              <p className="text-sm text-brown-600 mb-4">
                Drag and drop your file here, or click to browse
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                aria-label="Import products file"
                title="Import products file"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Select File'
                )}
              </Button>
            </div>

            <div className="bg-brown-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-brown-900 mb-2">File Format Requirements:</p>
              <ul className="text-sm text-brown-600 space-y-1">
                <li>- <strong>Products sheet:</strong> name, description, sku, category, base_price, stock_quantity, condition, unit_weight_grams, main_image_url, is_active</li>
                <li>- <strong>Variants sheet (optional):</strong> product_sku, variant_name, sku, variant_image_url, unit_label, weight_grams, price_adjustment, stock_quantity</li>
                <li>- <strong>Category:</strong> dog-food, cat-food, toys, accessories, grooming, health</li>
                <li>- <strong>Condition:</strong> new, secondhand</li>
                <li>- <strong>is_active:</strong> true, false</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <FileDown className="mr-2 h-4 w-4" />
                Download Excel Template
              </Button>
              <a href="/templates/products_import_template.csv" download>
                <Button variant="outline" size="sm">
                  <FileDown className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
              </a>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
