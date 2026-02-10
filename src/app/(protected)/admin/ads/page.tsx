'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Upload,
  X,
  Calendar,
  BarChart3,
  Eye,
  MousePointer,
  Target,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { AdvertisementCampaign, AdPosition, AdStatus, AdTestGroup } from '@/types/database';

interface AdFormData {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  position: AdPosition;
  start_date: string;
  end_date: string;
  status: AdStatus;
  priority: number;
  is_active: boolean;
  ab_test_group: AdTestGroup | '';
  target_device_types: string[];
  target_user_tiers: string[];
}

const initialFormData: AdFormData = {
  title: '',
  description: '',
  image_url: '',
  link_url: '',
  position: 'sidebar',
  start_date: '',
  end_date: '',
  status: 'active',
  priority: 0,
  is_active: true,
  ab_test_group: '',
  target_device_types: [],
  target_user_tiers: [],
};

const positions: { value: AdPosition; label: string }[] = [
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'interstitial', label: 'Interstitial' },
  { value: 'banner', label: 'Banner' },
  { value: 'popup', label: 'Popup' },
];

const deviceTypes = [
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
  { value: 'tablet', label: 'Tablet', icon: Tablet },
  { value: 'desktop', label: 'Desktop', icon: Monitor },
];

const userTiers = [
  { value: 'Newborn', label: 'Newborn' },
  { value: 'Transitional', label: 'Transitional' },
  { value: 'Juvenile', label: 'Juvenile' },
  { value: 'Adolescence', label: 'Adolescence' },
  { value: 'Adulthood', label: 'Adulthood' },
];

export default function AdsAdminPage() {
  const [ads, setAds] = useState<AdvertisementCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdvertisementCampaign | null>(null);
  const [formData, setFormData] = useState<AdFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const supabase = createClient();

  // Fetch ads
  const fetchAds = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('advertisement_campaigns')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast.error('Failed to load advertisements');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/webp', 'image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (WebP, JPEG, PNG, GIF)');
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage via API
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ads/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const { url } = await response.json();
      setFormData((prev) => ({ ...prev, image_url: url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open dialog for create/edit
  const handleOpenDialog = (ad?: AdvertisementCampaign) => {
    if (ad) {
      setSelectedAd(ad);
      setFormData({
        title: ad.title,
        description: ad.description || '',
        image_url: ad.image_url,
        link_url: ad.link_url || '',
        position: ad.position,
        start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
        end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
        status: ad.status,
        priority: ad.priority,
        is_active: ad.is_active,
        ab_test_group: ad.ab_test_group || '',
        target_device_types: ad.target_audience?.device_types || [],
        target_user_tiers: ad.target_audience?.user_tiers || [],
      });
      setImagePreview(ad.image_url);
    } else {
      setSelectedAd(null);
      setFormData(initialFormData);
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

  // Save ad
  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.image_url) {
      toast.error('Image is required');
      return;
    }

    setSaving(true);

    try {
      const adData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        image_url: formData.image_url,
        link_url: formData.link_url.trim() || null,
        position: formData.position,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        status: formData.status,
        priority: formData.priority,
        is_active: formData.is_active,
        ab_test_group: formData.ab_test_group || null,
        target_audience: {
          device_types: formData.target_device_types.length > 0 ? formData.target_device_types : null,
          user_tiers: formData.target_user_tiers.length > 0 ? formData.target_user_tiers : null,
        },
      };

      if (selectedAd) {
        // Update existing
        const { error } = await supabase
          .from('advertisement_campaigns')
          .update(adData)
          .eq('id', selectedAd.id);

        if (error) throw error;
        toast.success('Advertisement updated successfully');
      } else {
        // Create new
        const { error } = await supabase
          .from('advertisement_campaigns')
          .insert(adData);

        if (error) throw error;
        toast.success('Advertisement created successfully');
      }

      setDialogOpen(false);
      fetchAds();
    } catch (error: any) {
      console.error('Error saving ad:', error);
      toast.error(error.message || 'Failed to save advertisement');
    } finally {
      setSaving(false);
    }
  };

  // Delete ad
  const handleDelete = async () => {
    if (!selectedAd) return;

    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .delete()
        .eq('id', selectedAd.id);

      if (error) throw error;

      toast.success('Advertisement deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAd(null);
      fetchAds();
    } catch (error: any) {
      console.error('Error deleting ad:', error);
      toast.error(error.message || 'Failed to delete advertisement');
    }
  };

  // Toggle active status
  const handleToggleActive = async (ad: AdvertisementCampaign) => {
    try {
      const { error } = await supabase
        .from('advertisement_campaigns')
        .update({ is_active: !ad.is_active, status: !ad.is_active ? 'active' : 'paused' })
        .eq('id', ad.id);

      if (error) throw error;

      setAds(ads.map((a) =>
        a.id === ad.id ? { ...a, is_active: !a.is_active, status: !a.is_active ? 'active' : 'paused' } : a
      ));
      toast.success(`Advertisement ${!ad.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Error toggling ad:', error);
      toast.error(error.message || 'Failed to update advertisement');
    }
  };

  // Calculate CTR
  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  };

  // Filter ads by tab
  const filteredAds = ads.filter((ad) => {
    switch (activeTab) {
      case 'active':
        return ad.is_active && ad.status === 'active';
      case 'paused':
        return !ad.is_active || ad.status === 'paused';
      case 'expired':
        return ad.status === 'expired';
      default:
        return true;
    }
  });

  const isAdActive = (ad: AdvertisementCampaign) => {
    return ad.is_active && ad.status === 'active' &&
      (!ad.start_date || new Date(ad.start_date) <= new Date()) &&
      (!ad.end_date || new Date(ad.end_date) >= new Date());
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Advertisement Campaigns</h1>
          <p className="text-brown-600">Manage sidebar, interstitial, and banner advertisements</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-brown-500">Total Campaigns</p>
                <p className="text-2xl font-bold">{ads.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-brown-500">Total Impressions</p>
                <p className="text-2xl font-bold">
                  {ads.reduce((sum, ad) => sum + ad.impression_count, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <MousePointer className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-brown-500">Total Clicks</p>
                <p className="text-2xl font-bold">
                  {ads.reduce((sum, ad) => sum + ad.click_count, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-brown-500">Avg CTR</p>
                <p className="text-2xl font-bold">
                  {calculateCTR(
                    ads.reduce((sum, ad) => sum + ad.impression_count, 0),
                    ads.reduce((sum, ad) => sum + ad.click_count, 0)
                  )}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All ({ads.length})</TabsTrigger>
          <TabsTrigger value="active">
            Active ({ads.filter((a) => isAdActive(a)).length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({ads.filter((a) => !a.is_active || a.status === 'paused').length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({ads.filter((a) => a.status === 'expired').length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Ads Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="p-4">
                <Skeleton className="aspect-video rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAds.length === 0 ? (
        <Card className="border-brown-200">
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-16 w-16 text-brown-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brown-900 mb-2">No Advertisements</h2>
            <p className="text-brown-600 mb-6">
              {activeTab === 'all'
                ? 'Create your first advertisement campaign'
                : `No ${activeTab} advertisements found`}
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <motion.div
              key={ad.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card
                className={cn(
                  'border-brown-200 overflow-hidden transition-opacity',
                  !isAdActive(ad) && 'opacity-60'
                )}
              >
                {/* Image */}
                <div className="relative aspect-video bg-brown-100">
                  {ad.image_url ? (
                    <img
                      src={ad.image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-brown-300" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant={isAdActive(ad) ? 'default' : 'secondary'}
                      className={cn(
                        isAdActive(ad) && 'bg-green-500 hover:bg-green-600'
                      )}
                    >
                      {isAdActive(ad) ? 'Active' : ad.status}
                    </Badge>
                  </div>

                  {/* Position Badge */}
                  <div className="absolute top-2 left-2">
                    <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                      {ad.position}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-brown-900 mb-1 truncate">{ad.title}</h3>

                  {/* Description */}
                  {ad.description && (
                    <p className="text-sm text-brown-500 line-clamp-2 mb-3">
                      {ad.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <Eye className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs font-semibold">{ad.impression_count.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">Views</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <MousePointer className="h-4 w-4 mx-auto mb-1 text-amber-500" />
                      <p className="text-xs font-semibold">{ad.click_count.toLocaleString()}</p>
                      <p className="text-[10px] text-gray-500">Clicks</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <Target className="h-4 w-4 mx-auto mb-1 text-purple-500" />
                      <p className="text-xs font-semibold">{calculateCTR(ad.impression_count, ad.click_count)}%</p>
                      <p className="text-[10px] text-gray-500">CTR</p>
                    </div>
                  </div>

                  {/* Dates */}
                  {(ad.start_date || ad.end_date) && (
                    <div className="flex items-center gap-1 text-xs text-brown-500 mb-3">
                      <Calendar className="h-3 w-3" />
                      {ad.start_date && format(new Date(ad.start_date), 'MMM d, yyyy')}
                      {ad.start_date && ad.end_date && ' - '}
                      {ad.end_date && format(new Date(ad.end_date), 'MMM d, yyyy')}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={ad.is_active}
                        onCheckedChange={() => handleToggleActive(ad)}
                      />
                      <span className="text-sm text-brown-600">
                        {ad.is_active ? 'On' : 'Off'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenDialog(ad)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setSelectedAd(ad);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAd ? 'Edit Campaign' : 'New Campaign'}
            </DialogTitle>
            <DialogDescription>
              {selectedAd
                ? 'Update the advertisement campaign details.'
                : 'Create a new advertisement campaign.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brown-900">Basic Information</h4>

              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Summer Sale 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the campaign"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://example.com/landing-page"
                />
              </div>
            </div>

            <Separator />

            {/* Image Upload */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brown-900">Image *</h4>

              <div className="border-2 border-dashed border-brown-200 rounded-lg p-4">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-48 object-contain rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-8 w-8 text-brown-400 animate-spin mb-2" />
                        <span className="text-sm text-brown-600">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-brown-400 mb-2" />
                        <span className="text-sm text-brown-600">Click to upload image</span>
                        <span className="text-xs text-brown-400 mt-1">
                          WebP, JPEG, PNG. Max 2MB
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/webp,image/jpeg,image/png,image/gif"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            <Separator />

            {/* Position & Schedule */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brown-900">Position & Schedule</h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) =>
                      setFormData({ ...formData, position: value as AdPosition })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos.value} value={pos.value}>
                          {pos.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority (0-100)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={0}
                    max={100}
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Targeting */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-brown-900">Targeting</h4>

              <div className="space-y-2">
                <Label>A/B Test Group</Label>
                <Select
                  value={formData.ab_test_group || 'none'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      ab_test_group: value === 'none' ? '' : (value as AdTestGroup),
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No A/B Test</SelectItem>
                    <SelectItem value="A">Group A</SelectItem>
                    <SelectItem value="B">Group B</SelectItem>
                    <SelectItem value="control">Control Group</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Device Types</Label>
                <div className="flex gap-4">
                  {deviceTypes.map((device) => {
                    const Icon = device.icon;
                    return (
                      <label
                        key={device.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.target_device_types.includes(device.value)}
                          onCheckedChange={(checked) => {
                            setFormData({
                              ...formData,
                              target_device_types: checked
                                ? [...formData.target_device_types, device.value]
                                : formData.target_device_types.filter((d) => d !== device.value),
                            });
                          }}
                        />
                        <Icon className="h-4 w-4" />
                        <span className="text-sm">{device.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <Label>User Tiers</Label>
                <div className="flex flex-wrap gap-3">
                  {userTiers.map((tier) => (
                    <label
                      key={tier.value}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={formData.target_user_tiers.includes(tier.value)}
                        onCheckedChange={(checked) => {
                          setFormData({
                            ...formData,
                            target_user_tiers: checked
                              ? [...formData.target_user_tiers, tier.value]
                              : formData.target_user_tiers.filter((t) => t !== tier.value),
                          });
                        }}
                      />
                      <span className="text-sm">{tier.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Status */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-brown-500">Show this advertisement</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingImage}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedAd ? 'Save Changes' : 'Create Campaign'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedAd?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
