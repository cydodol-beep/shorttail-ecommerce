'use client';

import { useState } from 'react';
import { 
  Truck, 
  Search,
  Filter,
  Loader2,
  Plus,
  Pencil,
  Save,
  Trash2,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/image-upload';
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
import { useAuth } from '@/hooks/use-auth';
import { useShippingCouriers, createCourier, updateCourier, deleteCourier, type ShippingCourier } from '@/hooks/use-shipping-couriers';
import { useProvinces } from '@/hooks/use-provinces';
import { createClient } from '@/lib/supabase/client';

export default function AdminShippingPage() {
  useAuth();
  const { couriers, loading, refresh } = useShippingCouriers();
  const { provinces } = useProvinces();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editOpen, setEditOpen] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState<ShippingCourier | null>(null);
  const [provinceRates, setProvinceRates] = useState<Record<number, { cost: number; estimated_days: string }>>({});
  
  // Form state
  const [formData, setFormData] = useState({
    courier_name: '',
    courier_logo_url: '',
    base_cost: 0,
    is_active: true,
  });

  // Filter couriers
  const filteredCouriers = couriers.filter((courier: ShippingCourier) => {
    const matchesSearch = courier.courier_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && courier.is_active) ||
      (statusFilter === 'inactive' && !courier.is_active);
    return matchesSearch && matchesStatus;
  });

  // Handle add courier
  const handleAddCourier = () => {
    setIsEditing(false);
    setFormData({
      courier_name: '',
      courier_logo_url: '',
      base_cost: 0,
      is_active: true,
    });
    setEditOpen(true);
  };

  // Handle edit courier
  const handleEditCourier = (courier: ShippingCourier) => {
    setIsEditing(true);
    setSelectedCourier(courier);
    setFormData({
      courier_name: courier.courier_name,
      courier_logo_url: courier.courier_logo_url || '',
      base_cost: courier.base_cost || 0,
      is_active: courier.is_active,
    });
    setEditOpen(true);
  };

  // Handle save courier
  const handleSaveCourier = async () => {
    // Validation
    if (!formData.courier_name.trim()) {
      toast.error('Courier name is required');
      return;
    }

    if (formData.base_cost < 0) {
      toast.error('Base cost cannot be negative');
      return;
    }

    setSaving(true);
    try {
      let success = false;

      if (isEditing && selectedCourier) {
        // Update existing courier
        success = await updateCourier(selectedCourier.id, formData);
        if (success) {
          toast.success('Courier updated successfully');
        }
      } else {
        // Create new courier
        const newCourier = await createCourier(formData);
        if (newCourier) {
          toast.success('Courier created successfully');
          success = true;
        }
      }

      if (success) {
        setEditOpen(false);
        refresh();
      } else {
        toast.error(isEditing ? 'Failed to update courier' : 'Failed to create courier');
      }
    } catch (err) {
      console.error('Error saving courier:', err);
      toast.error(isEditing ? 'Failed to update courier' : 'Failed to create courier');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete courier
  const handleDeleteCourier = async () => {
    if (!selectedCourier) return;

    setSaving(true);
    try {
      const success = await deleteCourier(selectedCourier.id);
      if (success) {
        toast.success('Courier deleted successfully');
        setDeleteOpen(false);
        refresh();
      } else {
        toast.error('Failed to delete courier');
      }
    } catch (err) {
      console.error('Error deleting courier:', err);
      toast.error('Failed to delete courier');
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle active status
  const handleToggleActive = async (courier: ShippingCourier) => {
    const success = await updateCourier(courier.id, {
      courier_name: courier.courier_name,
      courier_logo_url: courier.courier_logo_url,
      base_cost: courier.base_cost,
      is_active: !courier.is_active,
    });

    if (success) {
      toast.success(`Courier ${!courier.is_active ? 'activated' : 'deactivated'}`);
      refresh();
    } else {
      toast.error('Failed to update courier status');
    }
  };

  // Handle manage province rates
  const handleManageRates = async (courier: ShippingCourier) => {
    setSelectedCourier(courier);
    setSaving(true);

    try {
      const supabase = createClient();
      
      // Fetch existing rates for this courier
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*, provinces(province_name)')
        .eq('courier_id', courier.id);

      if (error) {
        console.error('Error fetching rates:', error);
        toast.error('Failed to load shipping rates');
        setSaving(false);
        return;
      }

      // Convert to Record format
      const ratesMap: Record<number, { cost: number; estimated_days: string }> = {};
      data?.forEach((rate: any) => {
        ratesMap[rate.province_id] = {
          cost: parseFloat(rate.cost) || 0,
          estimated_days: rate.estimated_days || '',
        };
      });

      setProvinceRates(ratesMap);
      setRatesOpen(true);
    } catch (err) {
      console.error('Exception loading rates:', err);
      toast.error('Failed to load shipping rates');
    } finally {
      setSaving(false);
    }
  };

  // Handle save province rates
  const handleSaveRates = async () => {
    if (!selectedCourier) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Delete existing rates
      await supabase
        .from('shipping_rates')
        .delete()
        .eq('courier_id', selectedCourier.id);

      // Insert new rates (only for provinces with cost > 0)
      const ratesToInsert = Object.entries(provinceRates)
        .filter(([_, rate]) => rate.cost > 0)
        .map(([provinceId, rate]) => ({
          courier_id: selectedCourier.id,
          province_id: parseInt(provinceId),
          cost: rate.cost,
          estimated_days: rate.estimated_days || null,
        }));

      if (ratesToInsert.length > 0) {
        const { error } = await supabase
          .from('shipping_rates')
          .insert(ratesToInsert);

        if (error) {
          console.error('Error saving rates:', error);
          toast.error('Failed to save shipping rates');
          setSaving(false);
          return;
        }
      }

      toast.success('Shipping rates saved successfully');
      setRatesOpen(false);
      refresh();
    } catch (err) {
      console.error('Exception saving rates:', err);
      toast.error('Failed to save shipping rates');
    } finally {
      setSaving(false);
    }
  };

  // Update province rate
  const updateProvinceRate = (provinceId: number, field: 'cost' | 'estimated_days', value: string | number) => {
    setProvinceRates(prev => ({
      ...prev,
      [provinceId]: {
        cost: field === 'cost' ? (typeof value === 'number' ? value : parseFloat(value) || 0) : (prev[provinceId]?.cost || 0),
        estimated_days: field === 'estimated_days' ? String(value) : (prev[provinceId]?.estimated_days || ''),
      }
    }));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Shipping Couriers</h1>
          <p className="text-brown-600 mt-1">Manage delivery partners and shipping costs</p>
        </div>
        <Button onClick={handleAddCourier}>
          <Plus className="h-4 w-4 mr-2" />
          Add Courier
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">{couriers.length}</p>
                <p className="text-xs text-brown-600">Total Couriers</p>
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
                  {couriers.filter((c: ShippingCourier) => c.is_active).length}
                </p>
                <p className="text-xs text-brown-600">Active Couriers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-800">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-brown-900">
                  {formatCurrency(
                    couriers.reduce((sum: number, c: ShippingCourier) => 
                      sum + (c.base_cost || 0), 0
                    ) / (couriers.length || 1)
                  )}
                </p>
                <p className="text-xs text-brown-600">Avg. Base Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Couriers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Couriers</CardTitle>
          <CardDescription>Manage shipping courier partners</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-400" />
              <Input
                placeholder="Search couriers..."
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
          ) : filteredCouriers.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="h-12 w-12 text-brown-300 mx-auto mb-3" />
              <p className="text-brown-600">No couriers found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Logo</TableHead>
                    <TableHead>Courier Name</TableHead>
                    <TableHead>Base Cost</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCouriers.map((courier: ShippingCourier) => (
                    <TableRow key={courier.id}>
                      <TableCell>
                        {courier.courier_logo_url ? (
                          <img 
                            src={courier.courier_logo_url} 
                            alt={courier.courier_name}
                            className="h-10 w-10 object-contain rounded"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-brown-100 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-brown-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{courier.courier_name}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(courier.base_cost || 0)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={courier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {courier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Switch
                            checked={courier.is_active}
                            onCheckedChange={() => handleToggleActive(courier)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleManageRates(courier)}
                            title="Manage province rates"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourier(courier)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCourier(courier);
                              setDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Courier' : 'Add New Courier'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Update courier details' : 'Add a new shipping courier partner'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="courier_name">Courier Name *</Label>
              <Input
                id="courier_name"
                value={formData.courier_name}
                onChange={(e) => setFormData({ ...formData, courier_name: e.target.value })}
                placeholder="e.g., JNE, J&T Express, SiCepat"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courier_logo_url">Courier Logo</Label>
              <ImageUpload
                value={formData.courier_logo_url}
                onChange={(url) => setFormData({ ...formData, courier_logo_url: url })}
                onRemove={() => setFormData({ ...formData, courier_logo_url: '' })}
                aspectRatio="logo"
                placeholder="Upload courier logo (will be converted to WebP)"
              />
              <p className="text-xs text-brown-500">
                Upload a logo image. It will be automatically converted to WebP format for optimal performance.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_cost">Base Cost (IDR) *</Label>
              <Input
                id="base_cost"
                type="number"
                value={formData.base_cost}
                onChange={(e) => setFormData({ ...formData, base_cost: parseFloat(e.target.value) || 0 })}
                placeholder="15000"
              />
              <p className="text-xs text-brown-500">
                Base shipping cost for this courier. You can set this as cost per kg or as a flat rate - use it as reference for manual shipping calculations in POS.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <h3 className="font-semibold">Active Status</h3>
                <p className="text-sm text-brown-600">Enable this courier for customers</p>
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
            <Button onClick={handleSaveCourier} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update' : 'Create'} Courier
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
            <AlertDialogTitle>Delete Courier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCourier?.courier_name}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCourier} 
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Province Rates Dialog */}
      <Dialog open={ratesOpen} onOpenChange={setRatesOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Shipping Rates - {selectedCourier?.courier_name}</DialogTitle>
            <DialogDescription>
              Set custom shipping costs per province. Leave cost as 0 to use base cost (
              {selectedCourier?.base_cost ? formatCurrency(selectedCourier.base_cost) : 'not set'}
              )
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 px-2 py-1 bg-brown-50 rounded font-semibold text-sm">
              <div className="col-span-5">Province</div>
              <div className="col-span-4">Cost (IDR)</div>
              <div className="col-span-3">Est. Delivery</div>
            </div>
            
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {provinces.map((province) => (
                <div key={province.id} className="grid grid-cols-12 gap-2 px-2 py-2 border rounded hover:bg-brown-50">
                  <div className="col-span-5 flex items-center font-medium">
                    {province.province_name}
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={provinceRates[province.id]?.cost || 0}
                      onChange={(e) => updateProvinceRate(province.id, 'cost', e.target.value)}
                      placeholder={selectedCourier?.base_cost?.toString() || '0'}
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="text"
                      value={provinceRates[province.id]?.estimated_days || ''}
                      onChange={(e) => updateProvinceRate(province.id, 'estimated_days', e.target.value)}
                      placeholder="2-3 days"
                      className="h-9"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRatesOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveRates} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Rates
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
