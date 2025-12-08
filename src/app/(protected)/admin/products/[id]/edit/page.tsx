'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Plus, Trash2, Loader2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useCategories } from '@/hooks/use-categories';
import { ImageUpload } from '@/components/ui/image-upload';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PawPrint } from 'lucide-react';
import { useRelatedProductsStore } from '@/store/related-products-store';

const variantSchema = z.object({
  id: z.string().optional(),
  variant_name: z.string().min(1, 'Variant name is required'),
  sku: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  stock_quantity: z.number().int().min(0, 'Stock must be non-negative'),
  weight_grams: z.number().int().min(0, 'Weight must be non-negative'),
});

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  sku: z.string().optional(),
  category_id: z.string().min(1, 'Please select a category'),
  base_price: z.number().min(0, 'Price must be positive').optional(),
  stock_quantity: z.number().int().min(0, 'Stock must be non-negative').optional(),
  condition: z.enum(['new', 'secondhand']),
  unit_weight_grams: z.number().int().min(0, 'Weight must be non-negative').optional(),
  main_image_url: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  has_variants: z.boolean(),
  variants: z.array(variantSchema).optional(),
  related_product_ids: z.array(z.string()).optional(),
});

type ProductForm = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [allProducts, setAllProducts] = useState<Array<{ id: string; name: string; main_image_url: string | null }>>([]);
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([]);
  const [initialRelatedIds, setInitialRelatedIds] = useState<string[]>([]);
  const { getActiveCategories, loading: categoriesLoading } = useCategories();
  const categories = getActiveCategories();
  const { addRelation, removeRelation, updateRelationOrder } = useRelatedProductsStore();

  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      category_id: '',
      base_price: 0,
      stock_quantity: 0,
      condition: 'new',
      unit_weight_grams: 0,
      main_image_url: '',
      is_active: true,
      has_variants: false,
      variants: [],
      related_product_ids: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const hasVariants = form.watch('has_variants');

  useEffect(() => {
    let isMounted = true;
    
    const fetchProduct = async () => {
      const supabase = createClient();
      
      // Fetch product, variants, related products, and all products in parallel
      const [productResult, variantsResult, relationsResult, allProductsResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single(),
        supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productId)
          .order('variant_name'),
        supabase
          .from('product_relations')
          .select('related_product_id, sort_order')
          .eq('product_id', productId)
          .order('sort_order'),
        supabase
          .from('products')
          .select('id, name, main_image_url')
          .eq('is_active', true)
          .neq('id', productId)
          .order('name'),
      ]);

      if (!isMounted) return;

      if (productResult.error || !productResult.data) {
        toast.error('Product not found');
        router.replace('/admin/products');
        return;
      }

      const product = productResult.data;
      const variants = variantsResult.data;
      const relations = relationsResult.data || [];

      // Set all products for the related products selector
      setAllProducts(allProductsResult.data || []);
      
      // Set related products from product_relations table
      const relatedIds = relations.map((r: any) => r.related_product_id);
      setRelatedProductIds(relatedIds);
      setInitialRelatedIds(relatedIds);

      form.reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku || '',
        category_id: product.category_id || '',
        base_price: product.base_price || 0,
        stock_quantity: product.stock_quantity || 0,
        condition: product.condition || 'new',
        unit_weight_grams: product.unit_weight_grams || 0,
        main_image_url: product.main_image_url || '',
        is_active: product.is_active,
        has_variants: product.has_variants,
        variants: variants?.map((v: { id: string; variant_name: string; sku: string | null; price_adjustment: number | null; stock_quantity: number; weight_grams: number | null }) => ({
          id: v.id,
          variant_name: v.variant_name,
          sku: v.sku || '',
          price: v.price_adjustment || 0,
          stock_quantity: v.stock_quantity,
          weight_grams: v.weight_grams || 0,
        })) || [],
        related_product_ids: relatedIds,
      });

      setFetching(false);
    };

    fetchProduct();
    
    return () => {
      isMounted = false;
    };
  }, [productId, router, form]);

  const onSubmit = async (data: ProductForm) => {
    console.log('=== SUBMIT STARTED ===');
    console.log('Form data:', data);
    
    // Manual validation for complex rules
    if (!data.has_variants && (data.base_price ?? 0) <= 0) {
      toast.error('Base price is required and must be greater than 0');
      return;
    }
    if (data.has_variants && (!data.variants || data.variants.length === 0)) {
      toast.error('At least one variant is required when variants are enabled');
      return;
    }

    setLoading(true);
    console.log('1. Loading set to true');
    
    try {
      const supabase = createClient();
      console.log('2. Supabase client created');
      
      const { variants, related_product_ids, ...productData } = data;

      // Step 1: Update product
      const productToUpdate = {
        name: productData.name,
        description: productData.description || null,
        sku: productData.sku || null,
        category_id: productData.category_id,
        condition: productData.condition,
        main_image_url: productData.main_image_url || null,
        is_active: productData.is_active,
        has_variants: productData.has_variants,
        base_price: productData.has_variants ? 0 : (productData.base_price ?? 0),
        stock_quantity: productData.has_variants ? 0 : (productData.stock_quantity ?? 0),
        unit_weight_grams: productData.has_variants ? 0 : (productData.unit_weight_grams ?? 0),
      };

      console.log('3. About to update product...', productToUpdate);
      
      // Use server-side API to bypass client-side RLS performance issues
      const response = await fetch('/api/products/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productData: productToUpdate,
          variants: data.has_variants ? variants : [],
        }),
      });

      const result = await response.json();
      console.log('4. Product update complete', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      // Step 2: Update related products in product_relations table
      const newRelatedIds = related_product_ids || [];
      const addedIds = newRelatedIds.filter((id: string) => !initialRelatedIds.includes(id));
      const removedIds = initialRelatedIds.filter(id => !newRelatedIds.includes(id));

      // Add new relations
      for (const relatedId of addedIds) {
        await addRelation(productId, relatedId);
      }

      // Remove old relations
      for (const relatedId of removedIds) {
        await removeRelation(productId, relatedId);
      }

      // Update sort order if order changed
      if (newRelatedIds.length > 0) {
        const relations = newRelatedIds.map((id: string, index: number) => ({
          id,
          sort_order: index
        }));
        await updateRelationOrder(productId, relations);
      }

      console.log('5. All updates successful');
      toast.success('Product updated successfully');
      
      console.log('6. Navigating to products list...');
      startTransition(() => {
        router.push('/admin/products');
      });
    } catch (error) {
      console.error('!!! UPDATE ERROR !!!', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    } finally {
      console.log('11. Finally block - setting loading false');
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Skeleton className="h-10 w-40 mb-6" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-48 mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to Products
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900">Edit Product</h1>
        <p className="text-brown-600">Update product information</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Product name, description, and details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Premium Dog Food" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your product..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="PRD-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select category"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categoriesLoading ? (
                                <SelectItem value="_loading" disabled>Loading categories...</SelectItem>
                              ) : categories.length === 0 ? (
                                <SelectItem value="_empty" disabled>No categories available</SelectItem>
                              ) : (
                                categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>
                                    {cat.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Pricing & Inventory - Only show when no variants */}
              {!hasVariants && (
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Pricing & Inventory</CardTitle>
                  <CardDescription>Set base pricing and stock (required when no variants)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="base_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Base Price (IDR) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="150000"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="condition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Condition</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="secondhand">Secondhand</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unit_weight_grams"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight (grams) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="500"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Variants */}
              <Card className="border-brown-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Product Variants</CardTitle>
                      <CardDescription>Add size, flavor, or other variants</CardDescription>
                    </div>
                    <FormField
                      control={form.control}
                      name="has_variants"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormLabel className="text-sm">Enable Variants</FormLabel>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardHeader>
                {hasVariants && (
                  <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-brown-50 rounded-lg space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">Variant {index + 1}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`variants.${index}.variant_name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Variant Name *</FormLabel>
                                <FormControl>
                                  <Input placeholder="500g" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.sku`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SKU (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="PRD-001-500G" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price (IDR) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="50000"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.stock_quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Stock *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="50"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`variants.${index}.weight_grams`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Weight (grams) *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="500"
                                    {...field}
                                    value={field.value ?? ''}
                                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() =>
                        append({
                          variant_name: '',
                          sku: '',
                          price: 0,
                          stock_quantity: 0,
                          weight_grams: 0,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Variant
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* Related Products */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Related Products</CardTitle>
                  <CardDescription>Select up to 5 products to show as recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="related_product_ids"
                    render={({ field }) => (
                      <FormItem>
                        <div className="mb-2 text-sm text-brown-600">
                          {field.value?.length || 0}/5 selected
                        </div>
                        <ScrollArea className="h-[300px] border rounded-md p-2">
                          <div className="space-y-2">
                            {allProducts.map((product) => {
                              const isSelected = field.value?.includes(product.id);
                              const isDisabled = !isSelected && (field.value?.length || 0) >= 5;
                              return (
                                <div
                                  key={product.id}
                                  className={`flex items-center gap-3 p-2 rounded-lg hover:bg-brown-50 ${isDisabled ? 'opacity-50' : ''}`}
                                >
                                  <Checkbox
                                    checked={isSelected}
                                    disabled={isDisabled}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        field.onChange([...(field.value || []), product.id]);
                                      } else {
                                        field.onChange(field.value?.filter((id: string) => id !== product.id) || []);
                                      }
                                    }}
                                  />
                                  <div className="w-10 h-10 rounded bg-brown-100 flex-shrink-0 overflow-hidden">
                                    {product.main_image_url ? (
                                      <img
                                        src={product.main_image_url}
                                        alt={product.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <PawPrint className="h-5 w-5 text-brown-300" />
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-sm truncate flex-1">{product.name}</span>
                                </div>
                              );
                            })}
                            {allProducts.length === 0 && (
                              <p className="text-sm text-brown-500 text-center py-4">
                                No other products available
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Active</FormLabel>
                          <FormDescription>Product is visible to customers</FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Image */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Product Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="main_image_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload
                            value={field.value}
                            onChange={field.onChange}
                            aspectRatio="square"
                            placeholder="Upload product image"
                          />
                        </FormControl>
                        <FormDescription>Click or drag to upload product image</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={loading || isPending}>
                  {(loading || isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Product
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
