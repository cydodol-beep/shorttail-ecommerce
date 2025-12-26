'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Save,
  Layout,
  GripVertical,
  Settings,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { convertImageToWebP } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLandingSectionsStore, type LandingSection } from '@/store/landing-sections-store';

const sectionIcons: Record<string, string> = {
  hero: '🏠',
  promo_banner: '📢',
  benefits: '✨',
  categories: '📁',
  flash_sale: '⚡',
  featured_products: '⭐',
  new_arrivals: '🆕',
  testimonials: '💬',
  newsletter: '📧',
  footer: '📋',
};

const sectionDescriptions: Record<string, string> = {
  hero: 'Main banner. Edit title, subtitle, and trust badges here. Background managed in Store Settings.',
  promo_banner: 'Active promotions banner. Manage promotion content in Admin → Promotions.',
  benefits: 'Trust badges and benefits grid. Edit icons, titles, descriptions, and colors directly here.',
  categories: 'Product categories grid. Manage categories in Admin → Categories.',
  flash_sale: 'Flash sale products. Manage flash sale promotions in Admin → Promotions.',
  featured_products: 'Best selling products. Automatically shows products with highest sales.',
  new_arrivals: 'Latest products. Automatically shows newest products from Admin → Products.',
  testimonials: 'Customer reviews. Manage testimonials in database (coming soon).',
  newsletter: 'Email subscription form. Subscribers saved to database automatically.',
  footer: 'Footer links and info. Social media links managed in Store Settings.',
};

export default function LandingPageSettingsPage() {
  const { sections, loading, fetchSections, updateSection, batchUpdateSections } = useLandingSectionsStore();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<Record<string, Record<string, any>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  useEffect(() => {
    const settings: Record<string, Record<string, any>> = {};
    sections.forEach((s) => {
      settings[s.id] = { ...s.settings };
    });
    setLocalSettings(settings);
  }, [sections]);

  const handleToggleVisibility = async (section: LandingSection) => {
    try {
      setSaving(section.id);
      await updateSection(section.id, { is_visible: !section.is_visible });
      toast.success(`${section.section_name} ${!section.is_visible ? 'shown' : 'hidden'}`);
    } catch {
      toast.error('Failed to update section');
    } finally {
      setSaving(null);
    }
  };

  const handleMoveUp = async (section: LandingSection, index: number) => {
    if (index === 0) return;
    const prevSection = sections[index - 1];
    const currentOrder = section.sort_order;
    const prevOrder = prevSection.sort_order;
    
    try {
      setSaving(section.id);
      // Use batch update to swap both at once
      await batchUpdateSections([
        { id: section.id, data: { sort_order: prevOrder } },
        { id: prevSection.id, data: { sort_order: currentOrder } }
      ]);
      // Force refresh to show changes immediately
      await fetchSections(true);
      toast.success('Section order updated');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder sections');
    } finally {
      setSaving(null);
    }
  };

  const handleMoveDown = async (section: LandingSection, index: number) => {
    if (index === sections.length - 1) return;
    const nextSection = sections[index + 1];
    const currentOrder = section.sort_order;
    const nextOrder = nextSection.sort_order;
    
    try {
      setSaving(section.id);
      // Use batch update to swap both at once
      await batchUpdateSections([
        { id: section.id, data: { sort_order: nextOrder } },
        { id: nextSection.id, data: { sort_order: currentOrder } }
      ]);
      // Force refresh to show changes immediately
      await fetchSections(true);
      toast.success('Section order updated');
    } catch (error) {
      console.error('Reorder error:', error);
      toast.error('Failed to reorder sections');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveSettings = async (section: LandingSection) => {
    try {
      setSaving(section.id);
      await updateSection(section.id, { settings: localSettings[section.id] });
      toast.success(`${section.section_name} settings saved`);
      setEditingSection(null);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const updateLocalSetting = (sectionId: string, key: string, value: any) => {
    setLocalSettings((prev) => ({
      ...prev,
      [sectionId]: {
        ...prev[sectionId],
        [key]: value,
      },
    }));
  };

  const renderSettingsEditor = (section: LandingSection) => {
    const settings = localSettings[section.id] || {};

    switch (section.section_key) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${section.id}-title`}>Title</Label>
              <Input
                id={`${section.id}-title`}
                value={settings.title || ''}
                onChange={(e) => updateLocalSetting(section.id, 'title', e.target.value)}
                placeholder="Main hero title"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
              <Input
                id={`${section.id}-subtitle`}
                value={settings.subtitle || ''}
                onChange={(e) => updateLocalSetting(section.id, 'subtitle', e.target.value)}
                placeholder="Highlighted text under title (e.g., Nature's Best)"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-description`}>Description</Label>
              <Input
                id={`${section.id}-description`}
                value={settings.description || ''}
                onChange={(e) => updateLocalSetting(section.id, 'description', e.target.value)}
                placeholder="Hero section description"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-ctaText`}>Primary Button Text</Label>
              <Input
                id={`${section.id}-ctaText`}
                value={settings.ctaText || ''}
                onChange={(e) => updateLocalSetting(section.id, 'ctaText', e.target.value)}
                placeholder="Text for primary button (e.g., Start Shopping)"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-buttonText`}>Secondary Button Text</Label>
              <Input
                id={`${section.id}-buttonText`}
                value={settings.buttonText || ''}
                onChange={(e) => updateLocalSetting(section.id, 'buttonText', e.target.value)}
                placeholder="Text for secondary button (e.g., Watch Video)"
              />
            </div>

            {/* Top Tags Editor */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Top Tags</Label>
              <p className="text-xs text-brown-500">Add top tags like '#1 Vet Recommended', 'New Collection 2024'</p>

              {(settings.topTags || []).map((tag: string, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={tag}
                    onChange={(e) => {
                      const newTags = [...(settings.topTags || [])];
                      newTags[index] = e.target.value;
                      updateLocalSetting(section.id, 'topTags', newTags);
                    }}
                    placeholder="e.g., #1 Vet Recommended"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newTags = (settings.topTags || []).filter((_: string, i: number) => i !== index);
                      updateLocalSetting(section.id, 'topTags', newTags);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {(!settings.topTags || settings.topTags.length < 4) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newTags = [...(settings.topTags || []), ''];
                    updateLocalSetting(section.id, 'topTags', newTags);
                  }}
                >
                  + Add Top Tag
                </Button>
              )}
            </div>

            {/* Image URLs Editor */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Hero Images</Label>
              <p className="text-xs text-brown-500">Add URLs for hero images or upload image files</p>

              {/* Primary Image Upload Section */}
              <div className="border border-dashed border-brown-200 rounded-lg p-4 bg-brown-50">
                <div className="flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    id="primary-hero-image-upload"
                    accept=".jpg,.jpeg,.png,.tif,.tiff,.webp,image/jpeg,image/png,image/tiff,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          alert('Please select an image file');
                          return;
                        }

                        // Check file size
                        if (file.size > 5 * 1024 * 1024) { // 5MB limit
                          alert('File size exceeds 5MB limit');
                          return;
                        }

                        // Check if it's a supported format but not WebP, then convert to WebP
                        const supportedFormats = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
                        if (!supportedFormats.includes(file.type)) {
                          alert('Unsupported file format. Please upload JPEG, PNG, TIFF, or WebP files.');
                          return;
                        }

                        // Convert to WebP if not WebP already
                        if (!file.type.includes('webp')) {
                          // Use WebP conversion utility
                          convertImageToWebP(file, 0.8, 1920, 1080)
                            .then(webpDataUrl => {
                              // Update the first image URL with the converted WebP data URL
                              const currentUrls = [...(settings.imageUrls || [])];
                              if (currentUrls.length > 0) {
                                currentUrls[0] = webpDataUrl;
                              } else {
                                currentUrls.push(webpDataUrl);
                              }
                              updateLocalSetting(section.id, 'imageUrls', currentUrls);
                            })
                            .catch(error => {
                              console.error('Error converting image to WebP:', error);
                              alert('Failed to convert image to WebP format');
                            });
                        } else {
                          // If it's already WebP, verify it's a valid WebP data URL
                          // Convert WebP file to data URL
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;

                            // Update the first image URL with the new data URL
                            const currentUrls = [...(settings.imageUrls || [])];
                            if (currentUrls.length > 0) {
                              currentUrls[0] = dataUrl;
                            } else {
                              currentUrls.push(dataUrl);
                            }
                            updateLocalSetting(section.id, 'imageUrls', currentUrls);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                  <div className="text-center">
                    <label
                      htmlFor="primary-hero-image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Primary Hero Image
                    </label>
                    <p className="text-xs text-brown-500 mt-2">Max file size: 5MB. Formats: JPEG, PNG, TIFF, WebP</p>
                  </div>
                </div>
              </div>

              {/* Secondary Image Upload Section */}
              <div className="border border-dashed border-brown-200 rounded-lg p-4 bg-brown-50">
                <div className="flex flex-col items-center justify-center gap-3">
                  <input
                    type="file"
                    id="secondary-hero-image-upload"
                    accept=".jpg,.jpeg,.png,.tif,.tiff,.webp,image/jpeg,image/png,image/tiff,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (!file.type.startsWith('image/')) {
                          alert('Please select an image file');
                          return;
                        }

                        // Check file size
                        if (file.size > 5 * 1024 * 1024) { // 5MB limit
                          alert('File size exceeds 5MB limit');
                          return;
                        }

                        // Check if it's a supported format but not WebP, then convert to WebP
                        const supportedFormats = ['image/jpeg', 'image/png', 'image/tiff', 'image/webp'];
                        if (!supportedFormats.includes(file.type)) {
                          alert('Unsupported file format. Please upload JPEG, PNG, TIFF, or WebP files.');
                          return;
                        }

                        // Convert to WebP if not WebP already
                        if (!file.type.includes('webp')) {
                          // Use WebP conversion utility
                          convertImageToWebP(file, 0.8, 1920, 1080)
                            .then(webpDataUrl => {
                              // Update the second image URL with the converted WebP data URL
                              const currentUrls = [...(settings.imageUrls || [])];
                              if (currentUrls.length > 1) {
                                currentUrls[1] = webpDataUrl;
                              } else if (currentUrls.length === 1) {
                                currentUrls.push(webpDataUrl);
                              } else {
                                currentUrls.push('', webpDataUrl); // Add empty first URL if needed
                              }
                              updateLocalSetting(section.id, 'imageUrls', currentUrls);
                            })
                            .catch(error => {
                              console.error('Error converting image to WebP:', error);
                              alert('Failed to convert image to WebP format');
                            });
                        } else {
                          // If it's already WebP, verify it's a valid WebP data URL
                          // Convert WebP file to data URL
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const dataUrl = event.target?.result as string;

                            // Update the second image URL with the new data URL
                            const currentUrls = [...(settings.imageUrls || [])];
                            if (currentUrls.length > 1) {
                              currentUrls[1] = dataUrl;
                            } else if (currentUrls.length === 1) {
                              currentUrls.push(dataUrl);
                            } else {
                              currentUrls.push('', dataUrl); // Add empty first URL if needed
                            }
                            updateLocalSetting(section.id, 'imageUrls', currentUrls);
                          };
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                  <div className="text-center">
                    <label
                      htmlFor="secondary-hero-image-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Secondary Hero Image
                    </label>
                    <p className="text-xs text-brown-500 mt-2">Max file size: 5MB. Formats: JPEG, PNG, TIFF, WebP</p>
                  </div>
                </div>
              </div>

              {/* Existing URL Inputs */}
              {(settings.imageUrls || []).map((url: string, index: number) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={url}
                    onChange={(e) => {
                      const newUrls = [...(settings.imageUrls || [])];
                      newUrls[index] = e.target.value;
                      updateLocalSetting(section.id, 'imageUrls', newUrls);
                    }}
                    placeholder={`Image URL ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newUrls = (settings.imageUrls || []).filter((_: string, i: number) => i !== index);
                      updateLocalSetting(section.id, 'imageUrls', newUrls);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {(!settings.imageUrls || settings.imageUrls.length < 2) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newUrls = [...(settings.imageUrls || []), ''];
                    updateLocalSetting(section.id, 'imageUrls', newUrls);
                  }}
                >
                  + Add Image URL
                </Button>
              )}
            </div>

          </div>
        );

      case 'promo_banner':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.autoRotate !== false}
                onCheckedChange={(v) => updateLocalSetting(section.id, 'autoRotate', v)}
              />
              <Label>Auto Rotate</Label>
            </div>
            <div>
              <Label htmlFor={`${section.id}-interval`}>Rotation Interval (ms)</Label>
              <Input
                id={`${section.id}-interval`}
                type="number"
                value={settings.rotateInterval || 5000}
                onChange={(e) => updateLocalSetting(section.id, 'rotateInterval', parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${section.id}-title`}>Title</Label>
              <Input
                id={`${section.id}-title`}
                value={settings.title || ''}
                onChange={(e) => updateLocalSetting(section.id, 'title', e.target.value)}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
              <Input
                id={`${section.id}-subtitle`}
                value={settings.subtitle || ''}
                onChange={(e) => updateLocalSetting(section.id, 'subtitle', e.target.value)}
                placeholder="Section subtitle"
              />
            </div>
          </div>
        );

      case 'flash_sale':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${section.id}-title`}>Title</Label>
              <Input
                id={`${section.id}-title`}
                value={settings.title || ''}
                onChange={(e) => updateLocalSetting(section.id, 'title', e.target.value)}
                placeholder="Flash Sale"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.showCountdown !== false}
                onCheckedChange={(v) => updateLocalSetting(section.id, 'showCountdown', v)}
              />
              <Label>Show Countdown</Label>
            </div>
          </div>
        );

      case 'featured_products':
      case 'new_arrivals':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${section.id}-title`}>Title</Label>
              <Input
                id={`${section.id}-title`}
                value={settings.title || ''}
                onChange={(e) => updateLocalSetting(section.id, 'title', e.target.value)}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
              <Input
                id={`${section.id}-subtitle`}
                value={settings.subtitle || ''}
                onChange={(e) => updateLocalSetting(section.id, 'subtitle', e.target.value)}
                placeholder="Section subtitle"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-limit`}>Products to show</Label>
              <Input
                id={`${section.id}-limit`}
                type="number"
                min={4}
                max={16}
                value={settings.limit || 8}
                onChange={(e) => updateLocalSetting(section.id, 'limit', parseInt(e.target.value))}
              />
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${section.id}-title`}>Title</Label>
              <Input
                id={`${section.id}-title`}
                value={settings.title || ''}
                onChange={(e) => updateLocalSetting(section.id, 'title', e.target.value)}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
              <Input
                id={`${section.id}-subtitle`}
                value={settings.subtitle || ''}
                onChange={(e) => updateLocalSetting(section.id, 'subtitle', e.target.value)}
                placeholder="Section subtitle"
              />
            </div>
          </div>
        );

      case 'newsletter':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`${section.id}-title`}>Title</Label>
              <Input
                id={`${section.id}-title`}
                value={settings.title || ''}
                onChange={(e) => updateLocalSetting(section.id, 'title', e.target.value)}
                placeholder="Section title"
              />
            </div>
            <div>
              <Label htmlFor={`${section.id}-subtitle`}>Subtitle</Label>
              <Input
                id={`${section.id}-subtitle`}
                value={settings.subtitle || ''}
                onChange={(e) => updateLocalSetting(section.id, 'subtitle', e.target.value)}
                placeholder="Section subtitle"
              />
            </div>
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.showSocialLinks !== false}
                onCheckedChange={(v) => updateLocalSetting(section.id, 'showSocialLinks', v)}
              />
              <Label>Show Social Links</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.showCategories !== false}
                onCheckedChange={(v) => updateLocalSetting(section.id, 'showCategories', v)}
              />
              <Label>Show Categories</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.showSupport !== false}
                onCheckedChange={(v) => updateLocalSetting(section.id, 'showSupport', v)}
              />
              <Label>Show Support Links</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.showLegal !== false}
                onCheckedChange={(v) => updateLocalSetting(section.id, 'showLegal', v)}
              />
              <Label>Show Legal Links</Label>
            </div>
          </div>
        );

      case 'benefits':
        const iconOptions = [
          { value: 'truck', label: 'Truck (Delivery)' },
          { value: 'shield', label: 'Shield (Security)' },
          { value: 'card', label: 'Credit Card (Payment)' },
          { value: 'headphones', label: 'Headphones (Support)' },
          { value: 'rotate', label: 'Rotate (Returns)' },
          { value: 'award', label: 'Award (Quality)' },
          { value: 'package', label: 'Package (Product)' },
          { value: 'heart', label: 'Heart (Care)' },
          { value: 'star', label: 'Star (Rating)' },
          { value: 'gift', label: 'Gift (Promo)' },
        ];

        const colorOptions = [
          { value: 'bg-green-100 text-green-600', label: 'Green' },
          { value: 'bg-blue-100 text-blue-600', label: 'Blue' },
          { value: 'bg-purple-100 text-purple-600', label: 'Purple' },
          { value: 'bg-orange-100 text-orange-600', label: 'Orange' },
          { value: 'bg-red-100 text-red-600', label: 'Red' },
          { value: 'bg-yellow-100 text-yellow-600', label: 'Yellow' },
          { value: 'bg-pink-100 text-pink-600', label: 'Pink' },
          { value: 'bg-indigo-100 text-indigo-600', label: 'Indigo' },
        ];

        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Benefits Grid</Label>
              <p className="text-xs text-brown-500 mb-3">Manage up to 6 benefits displayed on homepage</p>
              
              <div className="space-y-4">
                {(settings.benefits || []).map((benefit: any, index: number) => (
                  <div key={index} className="border border-brown-200 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-brown-700">Benefit {index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const newBenefits = (settings.benefits || []).filter((_: any, i: number) => i !== index);
                          updateLocalSetting(section.id, 'benefits', newBenefits);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`benefit-icon-${index}`} className="text-xs">Icon</Label>
                        <select
                          id={`benefit-icon-${index}`}
                          value={benefit.icon}
                          onChange={(e) => {
                            const newBenefits = [...(settings.benefits || [])];
                            newBenefits[index] = { ...newBenefits[index], icon: e.target.value };
                            updateLocalSetting(section.id, 'benefits', newBenefits);
                          }}
                          className="w-full px-3 py-2 border border-brown-200 rounded-md text-sm"
                        >
                          {iconOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor={`benefit-color-${index}`} className="text-xs">Color</Label>
                        <select
                          id={`benefit-color-${index}`}
                          value={benefit.color}
                          onChange={(e) => {
                            const newBenefits = [...(settings.benefits || [])];
                            newBenefits[index] = { ...newBenefits[index], color: e.target.value };
                            updateLocalSetting(section.id, 'benefits', newBenefits);
                          }}
                          className="w-full px-3 py-2 border border-brown-200 rounded-md text-sm"
                        >
                          {colorOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`benefit-title-${index}`} className="text-xs">Title</Label>
                      <Input
                        id={`benefit-title-${index}`}
                        value={benefit.title}
                        onChange={(e) => {
                          const newBenefits = [...(settings.benefits || [])];
                          newBenefits[index] = { ...newBenefits[index], title: e.target.value };
                          updateLocalSetting(section.id, 'benefits', newBenefits);
                        }}
                        placeholder="e.g., Fast Delivery"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`benefit-desc-${index}`} className="text-xs">Description</Label>
                      <Input
                        id={`benefit-desc-${index}`}
                        value={benefit.description}
                        onChange={(e) => {
                          const newBenefits = [...(settings.benefits || [])];
                          newBenefits[index] = { ...newBenefits[index], description: e.target.value };
                          updateLocalSetting(section.id, 'benefits', newBenefits);
                        }}
                        placeholder="e.g., 2-3 days delivery"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {(!settings.benefits || settings.benefits.length < 6) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const newBenefits = [...(settings.benefits || []), {
                      icon: 'package',
                      title: '',
                      description: '',
                      color: 'bg-green-100 text-green-600'
                    }];
                    updateLocalSetting(section.id, 'benefits', newBenefits);
                  }}
                  className="mt-3"
                >
                  + Add Benefit
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return (
          <p className="text-sm text-muted-foreground">No customizable settings for this section.</p>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Landing Page Settings</h1>
          <p className="text-brown-600">Manage your homepage sections</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brown-900 flex items-center gap-2">
            <Layout className="h-8 w-8" />
            Landing Page Settings
          </h1>
          <p className="text-brown-600">Show/hide, reorder, and customize homepage sections</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => window.open('/', '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Frontend
          </Button>
          <Button variant="outline" onClick={() => fetchSections(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {sections.map((section, index) => (
          <Card key={section.id} className={`transition-opacity ${!section.is_visible ? 'opacity-60' : ''}`}>
            <Collapsible
              open={editingSection === section.id}
              onOpenChange={(open: boolean) => setEditingSection(open ? section.id : null)}
            >
              <div className="flex items-center gap-4 p-4">
                {/* Drag Handle & Icon */}
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <span className="text-2xl">{sectionIcons[section.section_key] || '📦'}</span>
                </div>

                {/* Section Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{section.section_name}</h3>
                    <Badge variant={section.is_visible ? 'default' : 'secondary'}>
                      {section.is_visible ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sectionDescriptions[section.section_key] || 'Section configuration'}
                  </p>
                  <p className="text-xs text-muted-foreground">Order: {section.sort_order}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Move Up/Down */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveUp(section, index)}
                    disabled={index === 0 || saving === section.id}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveDown(section, index)}
                    disabled={index === sections.length - 1 || saving === section.id}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>

                  {/* Toggle Visibility */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleVisibility(section)}
                    disabled={saving === section.id}
                  >
                    {section.is_visible ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>

                  {/* Settings Toggle */}
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent>
                <div className="border-t px-4 py-4 bg-muted/50">
                  <h4 className="font-medium mb-4">Section Settings</h4>
                  {renderSettingsEditor(section)}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSection(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveSettings(section)}
                      disabled={saving === section.id}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}
