'use client';

import { useState } from 'react';
import { 
  Tag, 
  Search,
  Filter,
  Loader2,
  Plus,
  Pencil,
  Save,
  Trash2,
  Percent,
  DollarSign,
  Gift,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Package,
  Truck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/use-auth';
import { usePromotions, createPromotion, updatePromotion, deletePromotion, type Promotion } from '@/hooks/use-promotions';
import { createClient } from '@/lib/supabase/client';

const DISCOUNT_TYPE_CONFIG = {
  percentage: { label: 'Percentage Off', icon: Percent, color: 'bg-blue-100 text-blue-800' },
  fixed: { label: 'Fixed Amount Off', icon: DollarSign, color: 'bg-green-100 text-green-800' },
  buy_x_get_y: { label: 'Buy X Get Y', icon: Gift, color: 'bg-purple-100 text-purple-800' },
  buy_more_save_more: { label: 'Buy More Save More', icon: Package, color: 'bg-orange-100 text-orange-800' },
  free_shipping: { label: 'Free Shipping', icon: Truck, color: 'bg-teal-100 text-teal-800' },
};

export default function AdminPromotionsPage() {
  useAuth();
  const { promotions, loading, refresh } = usePromotions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_purchase_amount: 0,
    start_date: '',
    end_date: '',
    is_active: true,
    applies_to: 'all_products',
    product_ids: [] as string[],
    free_shipping: false,
    buy_quantity: 1,
    get_quantity: 1,
    max_uses_per_user: 0,
    tiers: [{ min_quantity: 2, discount_percentage: 5 }] as { min_quantity: number; discount_percentage: number }[],
    available_for_pos: true,
  });

  // Filter promotions
  const filteredPromotions = promotions.filter((promo: Promotion) => {
    const matchesSearch = 
      promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && promo.is_active) ||
      (statusFilter === 'inactive' && !promo.is_active);
    return matchesSearch && matchesStatus;
  });

  // Handle add promotion
  const handleAddPromotion = async () => {
    setIsEditing(false);
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      min_purchase_amount: 0,
      start_date: '',
      end_date: '',
      is_active: true,
      applies_to: 'all_products',
      product_ids: [],
      free_shipping: false,
      buy_quantity: 1,
      get_quantity: 1,
      max_uses_per_user: 0,
      tiers: [{ min_quantity: 2, discount_percentage: 5 }],
      available_for_pos: true,
    });
    
    await loadProducts();
    setEditOpen(true);
  };

  // Load products
  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('products')
        .select('id, name, sku')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Handle edit promotion
  const handleEditPromotion = async (promo: Promotion) => {
    setIsEditing(true);
    setSelectedPromotion(promo);
    
    // Load tiers if buy_more_save_more
    let tiers = [{ min_quantity: 2, discount_percentage: 5 }];
    if (promo.discount_type === 'buy_more_save_more') {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('promotion_tiers')
          .select('*')
          .eq('promotion_id', promo.id)
          .order('min_quantity');
        
        if (data && data.length > 0) {
          tiers = data.map(t => ({
            min_quantity: t.min_quantity,
            discount_percentage: parseFloat(t.discount_percentage)
          }));
        }
      } catch (err) {
        console.error('Error loading tiers:', err);
      }
    }

    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value,
      min_purchase_amount: promo.min_purchase_amount || 0,
      start_date: promo.start_date ? new Date(promo.start_date).toISOString().slice(0, 16) : '',
      end_date: promo.end_date ? new Date(promo.end_date).toISOString().slice(0, 16) : '',
      is_active: promo.is_active,
      applies_to: promo.applies_to || 'all_products',
      product_ids: promo.product_ids || [],
      free_shipping: promo.free_shipping || false,
      buy_quantity: promo.buy_quantity || 1,
      get_quantity: promo.get_quantity || 1,
      max_uses_per_user: promo.max_uses_per_user || 0,
      tiers,
      available_for_pos: promo.available_for_pos ?? true,
    });
    
    await loadProducts();
    setEditOpen(true);
  };

  // Handle save promotion
  const handleSavePromotion = async () => {
    // Validation
    if (!formData.code.trim()) {
      toast.error('Promotion code is required');
      return;
    }

    // Validate discount value for types that require it
    if (formData.discount_type === 'percentage' || formData.discount_type === 'fixed') {
      if (formData.discount_value <= 0) {
        toast.error('Discount value must be greater than 0');
        return;
      }

      if (formData.discount_type === 'percentage' && formData.discount_value > 100) {
        toast.error('Percentage discount cannot exceed 100%');
        return;
      }
    }

    // Validate Buy X Get Y
    if (formData.discount_type === 'buy_x_get_y') {
      if (formData.buy_quantity < 1 || formData.get_quantity < 1) {
        toast.error('Buy and Get quantities must be at least 1');
        return;
      }
    }

    // Validate Buy More Save More
    if (formData.discount_type === 'buy_more_save_more') {
      if (formData.tiers.length === 0) {
        toast.error('Add at least one tier for Buy More Save More promotion');
        return;
      }
      // Validate each tier
      for (const tier of formData.tiers) {
        if (tier.min_quantity < 1) {
          toast.error('Tier minimum quantity must be at least 1');
          return;
        }
        if (tier.discount_percentage <= 0 || tier.discount_percentage > 100) {
          toast.error('Tier discount percentage must be between 0 and 100');
          return;
        }
      }
    }

    if (formData.applies_to === 'specific_products' && formData.product_ids.length === 0) {
      toast.error('Select at least one product');
      return;
    }

    setSaving(true);
    try {
      let success = false;

      if (isEditing && selectedPromotion) {
        success = await updatePromotion(selectedPromotion.id, formData);
        if (success) {
          toast.success('Promotion updated successfully');
        }
      } else {
        const newPromo = await createPromotion(formData);
        if (newPromo) {
          toast.success('Promotion created successfully');
          success = true;
        }
      }

      if (success) {
        setEditOpen(false);
        refresh();
      } else {
        toast.error(isEditing ? 'Failed to update promotion' : 'Failed to create promotion');
      }
    } catch (err) {
      console.error('Error saving promotion:', err);
      toast.error(isEditing ? 'Failed to update promotion' : 'Failed to create promotion');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete promotion
  const handleDeletePromotion = async () => {
    if (!selectedPromotion) return;

    setSaving(true);
    try {
      const success = await deletePromotion(selectedPromotion.id);
      if (success) {
        toast.success('Promotion deleted successfully');
        setDeleteOpen(false);
        refresh();
      } else {
        toast.error('Failed to delete promotion');
      }
    } catch (err) {
      console.error('Error deleting promotion:', err);
      toast.error('Failed to delete promotion');
    } finally {
      setSaving(false);
    }
  };

  // Add tier
  const addTier = () => {
    const lastTier = formData.tiers[formData.tiers.length - 1];
    const newMinQty = lastTier ? lastTier.min_quantity + 1 : 2;
    const newDiscount = lastTier ? lastTier.discount_percentage + 5 : 10;
    
    setFormData({
      ...formData,
      tiers: [...formData.tiers, { min_quantity: newMinQty, discount_percentage: newDiscount }]
    });
  };

  // Remove tier
  const removeTier = (index: number) => {
    setFormData({
      ...formData,
      tiers: formData.tiers.filter((_, i) => i !== index)
    });
  };

  // Update tier
  const updateTier = (index: number, field: 'min_quantity' | 'discount_percentage', value: number) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  // Toggle product selection
  const toggleProduct = (productId: string) => {
    setFormData(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(productId)
        ? prev.product_ids.filter(id => id !== productId)
        : [...prev.product_ids, productId]
    }));
  };

  // Toggle POS availability
  const togglePosAvailability = async (promo: Promotion) => {
    try {
      const newValue = !promo.available_for_pos;
      const success = await updatePromotion(promo.id, {
        ...promo,
        available_for_pos: newValue,
        tiers: undefined, // Don't send tiers in quick toggle
      });

      if (success) {
        toast.success(`POS availability ${newValue ? 'enabled' : 'disabled'}`);
        refresh();
      } else {
        toast.error('Failed to update POS availability');
      }
    } catch (err) {
      console.error('Error toggling POS availability:', err);
      toast.error('Failed to update POS availability');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string | null) => {
    if (!date) return 'No limit';
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Check if promotion is currently valid
  const isPromotionValid = (promo: Promotion) => {
    const now = new Date();
    const start = promo.start_date ? new Date(promo.start_date) : null;
    const end = promo.end_date ? new Date(promo.end_date) : null;
    
    if (start && now < start) return false;
    if (end && now > end) return false;
    return promo.is_active;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Promotions & Discounts</h1>
          <p className="text-brown-600 mt-1">Manage discount codes and promotional campaigns</p>
        </div>
        <Button onClick={handleAddPromotion}>
          <Plus className="h-4 w-4 mr-2" />
          Add Promotion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Tag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{promotions.length}</p>
                <p className="text-xs text-brown-600">Total Promotions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-800">
                <ToggleRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">
                  {promotions.filter((p: Promotion) => p.is_active).length}
                </p>
                <p className="text-xs text-brown-600">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">
                  {promotions.filter((p: Promotion) => isPromotionValid(p)).length}
                </p>
                <p className="text-xs text-brown-600">Currently Valid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 text-red-800">
                <ToggleLeft className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">
                  {promotions.filter((p: Promotion) => !p.is_active).length}
                </p>
                <p className="text-xs text-brown-600">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Promotions</CardTitle>
          <CardDescription>Manage discount codes and promotional offers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search by code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]" suppressHydrationWarning>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-brown-300 mx-auto mb-3" />
              <p className="text-brown-600">No promotions found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Features</TableHead>
                    <TableHead>Valid Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>POS</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromotions.map((promo: Promotion) => {
                    const typeConfig = DISCOUNT_TYPE_CONFIG[promo.discount_type as keyof typeof DISCOUNT_TYPE_CONFIG];
                    const TypeIcon = typeConfig?.icon || Tag;
                    const isValid = isPromotionValid(promo);
                    
                    return (
                      <TableRow key={promo.id}>
                        <TableCell>
                          <code className="px-2 py-1 bg-brown-100 rounded text-sm font-mono font-semibold">
                            {promo.code}
                          </code>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {promo.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={typeConfig?.color || 'bg-gray-100 text-gray-800'}>
                            <TypeIcon className="h-3 w-3 mr-1" />
                            {typeConfig?.label || promo.discount_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}%` :
                           promo.discount_type === 'fixed' ? formatCurrency(promo.discount_value) :
                           promo.discount_type === 'buy_x_get_y' ? `Buy ${promo.buy_quantity} Get ${promo.get_quantity}` :
                           promo.discount_type === 'free_shipping' ? 'Free Shipping' :
                           'Tiered Discount'}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {promo.free_shipping && (
                              <Badge variant="outline" className="text-xs">
                                <Truck className="h-3 w-3 mr-1" />
                                Free Ship
                              </Badge>
                            )}
                            {promo.applies_to === 'specific_products' && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                {promo.product_ids?.length || 0} Products
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-brown-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(promo.start_date)}
                            </div>
                            <div className="text-brown-500">
                              to {formatDate(promo.end_date)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {promo.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {promo.is_active && !isValid && (
                              <Badge variant="outline" className="text-xs">
                                {new Date() < new Date(promo.start_date || '') ? 'Scheduled' : 'Expired'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={promo.available_for_pos ?? true}
                              onCheckedChange={() => togglePosAvailability(promo)}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className="text-xs text-brown-600">
                              {promo.available_for_pos ?? true ? 'Yes' : 'No'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPromotion(promo)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPromotion(promo);
                                setDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Promotion' : 'Add New Promotion'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update promotion details' : 'Create a new discount code or promotional offer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Promotion Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., NEWYEAR2025"
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_uses_per_user">Max Uses Per User</Label>
                  <Input
                    id="max_uses_per_user"
                    type="number"
                    value={formData.max_uses_per_user}
                    onChange={(e) => setFormData({ ...formData, max_uses_per_user: parseInt(e.target.value) || 0 })}
                    placeholder="0 = unlimited"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., New Year special discount"
                  rows={2}
                />
              </div>
            </div>

            {/* Discount Type */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Discount Type *</h3>
              
              <Select 
                value={formData.discount_type} 
                onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage Off (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount Off (IDR)</SelectItem>
                  <SelectItem value="buy_x_get_y">Buy X Get Y</SelectItem>
                  <SelectItem value="buy_more_save_more">Buy More Save More (Tiered)</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Conditional Fields Based on Type */}
              {(formData.discount_type === 'percentage' || formData.discount_type === 'fixed') && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    Discount Value * {formData.discount_type === 'percentage' ? '(%)' : '(IDR)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                  />
                </div>
              )}

              {formData.discount_type === 'buy_x_get_y' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buy_quantity">Buy Quantity *</Label>
                    <Input
                      id="buy_quantity"
                      type="number"
                      min="1"
                      value={formData.buy_quantity}
                      onChange={(e) => setFormData({ ...formData, buy_quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="get_quantity">Get Quantity *</Label>
                    <Input
                      id="get_quantity"
                      type="number"
                      min="1"
                      value={formData.get_quantity}
                      onChange={(e) => setFormData({ ...formData, get_quantity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              )}

              {formData.discount_type === 'buy_more_save_more' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Discount Tiers *</Label>
                    <Button type="button" size="sm" onClick={addTier}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Tier
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.tiers.map((tier, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Min Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={tier.min_quantity}
                              onChange={(e) => updateTier(index, 'min_quantity', parseInt(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Discount %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={tier.discount_percentage}
                              onChange={(e) => updateTier(index, 'discount_percentage', parseFloat(e.target.value) || 0)}
                              className="h-8"
                            />
                          </div>
                        </div>
                        {formData.tiers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTier(index)}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-brown-500">
                    Example: Buy 2+ get 5% off, Buy 5+ get 10% off, etc.
                  </p>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Applies To</h3>
              
              <RadioGroup 
                value={formData.applies_to} 
                onValueChange={(value) => setFormData({ ...formData, applies_to: value, product_ids: [] })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all_products" id="all" />
                  <Label htmlFor="all">All Products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="specific_products" id="specific" />
                  <Label htmlFor="specific">Specific Products</Label>
                </div>
              </RadioGroup>

              {formData.applies_to === 'specific_products' && (
                <div className="border rounded p-4 max-h-64 overflow-y-auto">
                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : products.length === 0 ? (
                    <p className="text-center text-brown-500 py-8">No products found</p>
                  ) : (
                    <div className="space-y-2">
                      {products.map(product => (
                        <div key={product.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={product.id}
                            checked={formData.product_ids.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <Label htmlFor={product.id} className="flex-1 cursor-pointer">
                            {product.name} {product.sku && `(${product.sku})`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                  {formData.product_ids.length > 0 && (
                    <p className="text-sm text-brown-600 mt-3">
                      {formData.product_ids.length} product(s) selected
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Additional Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Additional Options</h3>
              
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <Label className="font-medium">Free Shipping</Label>
                  <p className="text-sm text-brown-600">Include free shipping with this promotion</p>
                </div>
                <Switch
                  checked={formData.free_shipping}
                  onCheckedChange={(checked) => setFormData({ ...formData, free_shipping: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <Label className="font-medium">Available for POS</Label>
                  <p className="text-sm text-brown-600">Allow kasir to use this promotion at POS checkout</p>
                </div>
                <Switch
                  checked={formData.available_for_pos}
                  onCheckedChange={(checked) => setFormData({ ...formData, available_for_pos: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_purchase_amount">Minimum Purchase Amount (IDR)</Label>
                <Input
                  id="min_purchase_amount"
                  type="number"
                  value={formData.min_purchase_amount}
                  onChange={(e) => setFormData({ ...formData, min_purchase_amount: parseFloat(e.target.value) || 0 })}
                  placeholder="0 = no minimum"
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Validity Period</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date & Time</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between p-3 border rounded">
              <div>
                <h3 className="font-semibold">Active Status</h3>
                <p className="text-sm text-brown-600">Enable or disable this promotion</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSavePromotion} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} Promotion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Promotion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the promotion "{selectedPromotion?.code}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePromotion} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
