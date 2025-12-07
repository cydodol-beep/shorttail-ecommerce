'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { createClient } from '@/lib/supabase/client';
import { useCategories } from '@/hooks/use-categories';
import { ImageUpload } from '@/components/ui/image-upload';

const variantSchema = z.object({
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
});

type ProductForm = z.infer<typeof productSchema>;

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { getActiveCategories, loading: categoriesLoading } = useCategories();
  const categories = getActiveCategories();

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
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const hasVariants = form.watch('has_variants');

  const onSubmit = async (data: ProductForm) => {
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

    const { variants, ...productData } = data;

    // If has variants, set base values to null/0 as they come from variants
    const productToInsert = {
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

    // Use server-side API
    const response = await fetch('/api/products/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productData: productToInsert,
        variants: data.has_variants ? variants : [],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(result.error || 'Failed to create product');
      setLoading(false);
      return;
    }

    toast.success('Product created successfully');
    setLoading(false);
    router.replace('/admin/products');
  };

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
        <h1 className="text-3xl font-bold text-brown-900">Add New Product</h1>
        <p className="text-brown-600">Create a new product listing</p>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Product
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
