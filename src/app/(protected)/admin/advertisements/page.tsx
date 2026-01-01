'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Image as ImageIcon, 
  ExternalLink,
  GripVertical,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Upload,
  X,
  Calendar
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
import { createClient } from '@/lib/supabase/client';

interface Advertisement {
  id: string;
  title: string;
  image_url: string;
  redirect_link: string | null;
  alt_text: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AdFormData {
  title: string;
  image_url: string;
  redirect_link: string;
  alt_text: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const initialFormData: AdFormData = {
  title: '',
  image_url: '',
  redirect_link: '',
  alt_text: '',
  is_active: true,
  start_date: '',
  end_date: '',
};

export default function AdvertisementsPage() {
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [formData, setFormData] = useState<AdFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const supabase = createClient();

  const fetchAdvertisements = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching advertisements:', error);
      toast.error('Failed to load advertisements');
    } else {
      setAdvertisements(data || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchAdvertisements();
  }, [fetchAdvertisements]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Create a canvas to resize and convert to WebP
      const img = document.createElement('img');
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = async () => {
          // Create canvas with 400x400 dimensions
          const canvas = document.createElement('canvas');
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Fill with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 400, 400);

            // Calculate dimensions to maintain aspect ratio and center
            const scale = Math.min(400 / img.width, 400 / img.height);
            const x = (400 - img.width * scale) / 2;
            const y = (400 - img.height * scale) / 2;

            ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

            // Convert to WebP
            const webpDataUrl = canvas.toDataURL('image/webp', 0.9);

            // Upload to Supabase Storage
            const fileName = `ad_${Date.now()}.webp`;
            const base64Data = webpDataUrl.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'image/webp' });

            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('advertisements')
              .upload(fileName, blob, {
                contentType: 'image/webp',
                upsert: true,
              });

            if (uploadError) {
              // If bucket doesn't exist, use base64 directly
              console.warn('Storage upload failed, using base64:', uploadError);
              setFormData({ ...formData, image_url: webpDataUrl });
              setImagePreview(webpDataUrl);
            } else {
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('advertisements')
                .getPublicUrl(fileName);

              setFormData({ ...formData, image_url: publicUrl });
              setImagePreview(publicUrl);
            }

            toast.success('Image processed successfully');
          }
          setUploadingImage(false);
        };
        img.src = event.target?.result as string;
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setUploadingImage(false);
    }
  };

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setSelectedAd(ad);
      setFormData({
        title: ad.title,
        image_url: ad.image_url,
        redirect_link: ad.redirect_link || '',
        alt_text: ad.alt_text || '',
        is_active: ad.is_active,
        start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
        end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
      });
      setImagePreview(ad.image_url);
    } else {
      setSelectedAd(null);
      setFormData(initialFormData);
      setImagePreview(null);
    }
    setDialogOpen(true);
  };

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
        image_url: formData.image_url,
        redirect_link: formData.redirect_link.trim() || null,
        alt_text: formData.alt_text.trim() || formData.title.trim(),
        is_active: formData.is_active,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
      };

      if (selectedAd) {
        // Update existing
        const { error } = await supabase
          .from('advertisements')
          .update(adData)
          .eq('id', selectedAd.id);

        if (error) throw error;
        toast.success('Advertisement updated successfully');
      } else {
        // Create new - get max display_order
        const { data: maxOrderData } = await supabase
          .from('advertisements')
          .select('display_order')
          .order('display_order', { ascending: false })
          .limit(1);

        const maxOrder = maxOrderData?.[0]?.display_order ?? -1;

        const { error } = await supabase
          .from('advertisements')
          .insert({ ...adData, display_order: maxOrder + 1 });

        if (error) throw error;
        toast.success('Advertisement created successfully');
      }

      setDialogOpen(false);
      fetchAdvertisements();
    } catch (error: any) {
      console.error('Error saving advertisement:', error);
      toast.error(error.message || 'Failed to save advertisement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAd) return;

    try {
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', selectedAd.id);

      if (error) throw error;

      toast.success('Advertisement deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedAd(null);
      fetchAdvertisements();
    } catch (error: any) {
      console.error('Error deleting advertisement:', error);
      toast.error(error.message || 'Failed to delete advertisement');
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    try {
      const { error } = await supabase
        .from('advertisements')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      if (error) throw error;

      setAdvertisements(advertisements.map(a => 
        a.id === ad.id ? { ...a, is_active: !a.is_active } : a
      ));
      toast.success(`Advertisement ${!ad.is_active ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      console.error('Error toggling advertisement:', error);
      toast.error(error.message || 'Failed to update advertisement');
    }
  };

  const isAdActive = (ad: Advertisement) => {
    if (!ad.is_active) return false;
    const now = new Date();
    if (ad.start_date && new Date(ad.start_date) > now) return false;
    if (ad.end_date && new Date(ad.end_date) < now) return false;
    return true;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Advertisements</h1>
          <p className="text-brown-600">Manage pop-up advertisements for the landing page</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Advertisement
        </Button>
      </div>

      {/* Info Card */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Image Requirements</p>
              <p>Images will be automatically resized to <strong>400×400 pixels</strong> and converted to WebP format for optimal performance.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertisements List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-brown-200">
              <CardContent className="p-4">
                <Skeleton className="aspect-square rounded-lg mb-4" />
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : advertisements.length === 0 ? (
        <Card className="border-brown-200">
          <CardContent className="py-16 text-center">
            <ImageIcon className="h-16 w-16 text-brown-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-brown-900 mb-2">No Advertisements</h2>
            <p className="text-brown-600 mb-6">
              Create your first pop-up advertisement to engage visitors
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Advertisement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advertisements.map((ad) => (
            <Card 
              key={ad.id} 
              className={`border-brown-200 overflow-hidden transition-opacity ${!isAdActive(ad) ? 'opacity-60' : ''}`}
            >
              <div className="relative aspect-square bg-brown-100">
                <img
                  src={ad.image_url}
                  alt={ad.alt_text || ad.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Badge variant={isAdActive(ad) ? 'default' : 'secondary'}>
                    {isAdActive(ad) ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-brown-900 mb-1 truncate">{ad.title}</h3>
                {ad.redirect_link && (
                  <a 
                    href={ad.redirect_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Link
                  </a>
                )}
                {(ad.start_date || ad.end_date) && (
                  <div className="text-xs text-brown-500 mb-3 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {ad.start_date && format(new Date(ad.start_date), 'MMM d, yyyy')}
                    {ad.start_date && ad.end_date && ' - '}
                    {ad.end_date && format(new Date(ad.end_date), 'MMM d, yyyy')}
                  </div>
                )}
                <div className="flex items-center justify-between">
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
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAd ? 'Edit Advertisement' : 'Create Advertisement'}
            </DialogTitle>
            <DialogDescription>
              {selectedAd 
                ? 'Update the advertisement details below.'
                : 'Fill in the details to create a new pop-up advertisement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., New Year Sale"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Image * (400×400px, WebP)</Label>
              <div className="border-2 border-dashed border-brown-200 rounded-lg p-3">
                {imagePreview ? (
                  <div className="relative flex items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brown-700 truncate">Image uploaded</p>
                      <p className="text-xs text-brown-500">400×400px WebP</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="flex-shrink-0 h-8 w-8"
                      onClick={() => {
                        setImagePreview(null);
                        setFormData({ ...formData, image_url: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-6 cursor-pointer">
                    {uploadingImage ? (
                      <>
                        <Loader2 className="h-8 w-8 text-brown-400 animate-spin mb-2" />
                        <span className="text-sm text-brown-600">Processing image...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-brown-400 mb-2" />
                        <span className="text-sm text-brown-600">Click to upload image</span>
                        <span className="text-xs text-brown-400 mt-1">Max 2MB, any format</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Redirect Link */}
            <div className="space-y-2">
              <Label htmlFor="redirect_link">Redirect Link (optional)</Label>
              <Input
                id="redirect_link"
                value={formData.redirect_link}
                onChange={(e) => setFormData({ ...formData, redirect_link: e.target.value })}
                placeholder="https://example.com/sale"
              />
            </div>

            {/* Alt Text */}
            <div className="space-y-2">
              <Label htmlFor="alt_text">Alt Text (optional)</Label>
              <Input
                id="alt_text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Description for accessibility"
              />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date (optional)</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date (optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-sm text-brown-500">Show this advertisement to visitors</p>
              </div>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploadingImage}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {selectedAd ? 'Save Changes' : 'Create Advertisement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
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
