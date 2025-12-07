'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Store, 
  CreditCard, 
  Truck, 
  Bell, 
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  Users,
  Gift,
  Share2,
  Plus,
  Trash2,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { useAuth } from '@/hooks/use-auth';
import { 
  useAllSettings,
  saveAllSettings,
  type StoreSettings,
  type ShippingSettings,
  type PaymentSettings,
  type LoyaltySettings,
  type NotificationSettings,
  defaultStoreSettings,
  defaultShippingSettings,
  defaultPaymentSettings,
  defaultLoyaltySettings,
  defaultNotificationSettings,
} from '@/hooks/use-store-settings';
import {
  SocialMediaLink,
  useSocialMedia,
  addSocialMediaLink,
  updateSocialMediaLink,
  deleteSocialMediaLink,
  AVAILABLE_SOCIAL_ICONS,
} from '@/hooks/use-social-media';
import { SocialIcon } from '@/components/ui/social-icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminSettingsPage() {
  useAuth();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('store');
  
  // Load settings from Supabase
  const { settings: loadedSettings, loading: settingsLoading, refresh: refreshSettings } = useAllSettings();
  
  // Social Media state
  const { links: socialMediaLinks, loading: socialLoading } = useSocialMedia();
  const [socialDialogOpen, setSocialDialogOpen] = useState(false);
  const [editingSocialLink, setEditingSocialLink] = useState<SocialMediaLink | null>(null);
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialForm, setSocialForm] = useState({
    platform: '',
    url: '',
    icon: 'facebook',
    isActive: true,
  });

  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [shippingSettings, setShippingSettings] = useState<ShippingSettings>(defaultShippingSettings);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>(defaultPaymentSettings);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings>(defaultLoyaltySettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(defaultNotificationSettings);

  // Load settings from Supabase when available
  useEffect(() => {
    if (!settingsLoading && loadedSettings) {
      console.log('Loading settings from DB:', {
        storeName: loadedSettings.store.storeName,
        hasLogo: !!loadedSettings.store.storeLogo,
        logoLength: loadedSettings.store.storeLogo?.length || 0
      });
      setStoreSettings(loadedSettings.store);
      setShippingSettings(loadedSettings.shipping);
      setPaymentSettings(loadedSettings.payment);
      setLoyaltySettings(loadedSettings.loyalty);
      setNotificationSettings(loadedSettings.notification);
    }
  }, [settingsLoading, loadedSettings]);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSave = useCallback(async () => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaving(true);
    
    try {
      const allSettings = {
        store: storeSettings,
        shipping: shippingSettings,
        payment: paymentSettings,
        loyalty: loyaltySettings,
        notification: notificationSettings,
      };
      
      console.log('Saving settings...');
      
      const { error } = await saveAllSettings(allSettings);
      
      if (error) {
        console.error('Save error:', error);
        toast.error(error.message || 'Failed to save settings');
      } else {
        console.log('Settings saved successfully');
        toast.success('Settings saved successfully');
        
        // Refresh settings from database to ensure sync
        setTimeout(() => {
          refreshSettings();
        }, 500);
      }
    } catch (err) {
      console.error('Exception during save:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }, [storeSettings, shippingSettings, paymentSettings, loyaltySettings, notificationSettings]);

  // Social Media handlers
  const handleOpenAddSocialDialog = () => {
    setEditingSocialLink(null);
    setSocialForm({
      platform: '',
      url: '',
      icon: 'facebook',
      isActive: true,
    });
    setSocialDialogOpen(true);
  };

  const handleOpenEditSocialDialog = (link: SocialMediaLink) => {
    setEditingSocialLink(link);
    setSocialForm({
      platform: link.platform,
      url: link.url,
      icon: link.icon,
      isActive: link.isActive,
    });
    setSocialDialogOpen(true);
  };

  const handleSaveSocialLink = async () => {
    if (!socialForm.platform || !socialForm.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSocialSaving(true);

    if (editingSocialLink) {
      const success = await updateSocialMediaLink(editingSocialLink.id, {
        platform: socialForm.platform,
        url: socialForm.url,
        icon: socialForm.icon,
        isActive: socialForm.isActive,
      });
      if (success) {
        toast.success('Social media link updated');
        setSocialDialogOpen(false);
      } else {
        toast.error('Failed to update social media link');
      }
    } else {
      const newLink = await addSocialMediaLink({
        platform: socialForm.platform,
        url: socialForm.url,
        icon: socialForm.icon,
        displayOrder: socialMediaLinks.length + 1,
        isActive: socialForm.isActive,
      });
      if (newLink) {
        toast.success('Social media link added');
        setSocialDialogOpen(false);
      } else {
        toast.error('Failed to add social media link');
      }
    }

    setSocialSaving(false);
  };

  const handleDeleteSocialLink = async (id: string) => {
    const success = await deleteSocialMediaLink(id);
    if (success) {
      toast.success('Social media link removed');
    } else {
      toast.error('Failed to delete social media link');
    }
  };

  const handleToggleSocialLink = async (id: string, currentStatus: boolean) => {
    const success = await updateSocialMediaLink(id, { isActive: !currentStatus });
    if (!success) {
      toast.error('Failed to update social media link');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brown-900">Settings</h1>
          <p className="text-brown-600">Manage your store configuration</p>
          {settingsLoading && (
            <p className="text-sm text-brown-500 mt-1">
              <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
              Loading settings...
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={refreshSettings}
            disabled={settingsLoading}
          >
            {settingsLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} suppressHydrationWarning>
        <TabsList className="mb-6">
          <TabsTrigger value="store" className="gap-2">
            <Store className="h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payment
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="gap-2">
            <Gift className="h-4 w-4" />
            Loyalty
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="h-4 w-4" />
            Social Media
          </TabsTrigger>
        </TabsList>

        {/* Store Settings */}
        <TabsContent value="store">
          <div className="grid gap-6">
            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Store Information
                </CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Store Logo</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    This logo will appear in the header next to your store name
                  </p>
                  {storeSettings.storeLogo && (
                    <p className="text-xs text-green-600 mb-2">
                      ✓ Logo uploaded ({Math.round(storeSettings.storeLogo.length / 1024)}KB) - Click "Save Changes" to store in database
                    </p>
                  )}
                  <div className="max-w-xs">
                    <ImageUpload
                      value={storeSettings.storeLogo}
                      onChange={(url) => {
                        console.log('Logo changed, length:', url.length);
                        setStoreSettings({ ...storeSettings, storeLogo: url });
                      }}
                      aspectRatio="logo"
                      placeholder="Upload store logo"
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <div className="flex items-center gap-3">
                      {storeSettings.storeLogo && (
                        <div className="relative w-10 h-10 flex-shrink-0 rounded border border-brown-200 overflow-hidden bg-white">
                          <img
                            src={storeSettings.storeLogo}
                            alt="Store Logo"
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      )}
                      <Input
                        id="storeName"
                        value={storeSettings.storeName}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input
                      id="storeEmail"
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Textarea
                    id="storeDescription"
                    value={storeSettings.storeDescription}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeDescription: e.target.value })}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports HTML and emojis: Use <code className="px-1 py-0.5 bg-muted rounded">&lt;a href="url"&gt;link&lt;/a&gt;</code> for links, 
                    <code className="px-1 py-0.5 bg-muted rounded mx-1">&lt;strong&gt;bold&lt;/strong&gt;</code> for bold text,
                    <code className="px-1 py-0.5 bg-muted rounded mx-1">&lt;em&gt;italic&lt;/em&gt;</code> for italics.
                    Add emojis directly: 🐶 🐱 🐰 ❤️ ⭐
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Phone Number</Label>
                    <Input
                      id="storePhone"
                      value={storeSettings.storePhone}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeCurrency">Currency</Label>
                    <Select
                      value={storeSettings.storeCurrency}
                      onValueChange={(value) => setStoreSettings({ ...storeSettings, storeCurrency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Store Address
                </CardTitle>
                <CardDescription>
                  Physical location of your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Street Address</Label>
                  <Input
                    id="storeAddress"
                    value={storeSettings.storeAddress}
                    onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeCity">City</Label>
                    <Input
                      id="storeCity"
                      value={storeSettings.storeCity}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeCity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeProvince">Province</Label>
                    <Input
                      id="storeProvince"
                      value={storeSettings.storeProvince}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storeProvince: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storePostalCode">Postal Code</Label>
                    <Input
                      id="storePostalCode"
                      value={storeSettings.storePostalCode}
                      onChange={(e) => setStoreSettings({ ...storeSettings, storePostalCode: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping">
          <div className="grid gap-6">
            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Shipping Configuration
                </CardTitle>
                <CardDescription>
                  Configure shipping rates and options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Free Shipping</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable free shipping for orders above threshold
                    </p>
                  </div>
                  <Switch
                    checked={shippingSettings.freeShippingEnabled}
                    onCheckedChange={(checked) => 
                      setShippingSettings({ ...shippingSettings, freeShippingEnabled: checked })
                    }
                  />
                </div>

                {shippingSettings.freeShippingEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (IDR)</Label>
                    <Input
                      id="freeShippingThreshold"
                      type="number"
                      value={shippingSettings.freeShippingThreshold}
                      onChange={(e) => 
                        setShippingSettings({ ...shippingSettings, freeShippingThreshold: Number(e.target.value) })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Orders above {formatCurrency(shippingSettings.freeShippingThreshold)} get free shipping
                    </p>
                  </div>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultShippingFee">Default Shipping Fee (IDR)</Label>
                    <Input
                      id="defaultShippingFee"
                      type="number"
                      value={shippingSettings.defaultShippingFee}
                      onChange={(e) => 
                        setShippingSettings({ ...shippingSettings, defaultShippingFee: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="processingDays">Processing Days</Label>
                    <Input
                      id="processingDays"
                      type="number"
                      value={shippingSettings.processingDays}
                      onChange={(e) => 
                        setShippingSettings({ ...shippingSettings, processingDays: Number(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cash on Delivery (COD)</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to pay upon delivery
                    </p>
                  </div>
                  <Switch
                    checked={shippingSettings.enableCOD}
                    onCheckedChange={(checked) => 
                      setShippingSettings({ ...shippingSettings, enableCOD: checked })
                    }
                  />
                </div>

                {shippingSettings.enableCOD && (
                  <div className="space-y-2">
                    <Label htmlFor="codFee">COD Fee (IDR)</Label>
                    <Input
                      id="codFee"
                      type="number"
                      value={shippingSettings.codFee}
                      onChange={(e) => 
                        setShippingSettings({ ...shippingSettings, codFee: Number(e.target.value) })
                      }
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment">
          <div className="grid gap-6">
            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Bank Transfer
                </CardTitle>
                <CardDescription>
                  Configure bank transfer payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Bank Transfer</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments via bank transfer
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.bankTransferEnabled}
                    onCheckedChange={(checked) => 
                      setPaymentSettings({ ...paymentSettings, bankTransferEnabled: checked })
                    }
                  />
                </div>

                {paymentSettings.bankTransferEnabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="bankName">Bank Name</Label>
                        <Select
                          value={paymentSettings.bankName}
                          onValueChange={(value) => setPaymentSettings({ ...paymentSettings, bankName: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="BNI">BNI</SelectItem>
                            <SelectItem value="BRI">BRI</SelectItem>
                            <SelectItem value="Mandiri">Mandiri</SelectItem>
                            <SelectItem value="CIMB">CIMB Niaga</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                        <Input
                          id="bankAccountNumber"
                          value={paymentSettings.bankAccountNumber}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccountNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName">Account Name</Label>
                      <Input
                        id="bankAccountName"
                        value={paymentSettings.bankAccountName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, bankAccountName: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  E-Wallet
                </CardTitle>
                <CardDescription>
                  Configure e-wallet payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable E-Wallet</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments via e-wallet
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.ewalletEnabled}
                    onCheckedChange={(checked) => 
                      setPaymentSettings({ ...paymentSettings, ewalletEnabled: checked })
                    }
                  />
                </div>

                {paymentSettings.ewalletEnabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ewalletProvider">E-Wallet Provider</Label>
                        <Select
                          value={paymentSettings.ewalletProvider}
                          onValueChange={(value) => setPaymentSettings({ ...paymentSettings, ewalletProvider: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GoPay">GoPay</SelectItem>
                            <SelectItem value="OVO">OVO</SelectItem>
                            <SelectItem value="DANA">DANA</SelectItem>
                            <SelectItem value="ShopeePay">ShopeePay</SelectItem>
                            <SelectItem value="LinkAja">LinkAja</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ewalletNumber">E-Wallet Number</Label>
                        <Input
                          id="ewalletNumber"
                          value={paymentSettings.ewalletNumber}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, ewalletNumber: e.target.value })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  QRIS Payment
                </CardTitle>
                <CardDescription>
                  Configure QRIS payment method
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable QRIS</Label>
                    <p className="text-sm text-muted-foreground">
                      Accept payments via QRIS
                    </p>
                  </div>
                  <Switch
                    checked={paymentSettings.qrisEnabled}
                    onCheckedChange={(checked) => 
                      setPaymentSettings({ ...paymentSettings, qrisEnabled: checked })
                    }
                  />
                </div>

                {paymentSettings.qrisEnabled && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <Label htmlFor="qrisImage">QRIS QR Code Image</Label>
                      <div className="max-w-xs">
                        <ImageUpload
                          value={paymentSettings.qrisImage}
                          onChange={(value) => setPaymentSettings({ ...paymentSettings, qrisImage: value })}
                          aspectRatio="square"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Upload your QRIS QR code image (will be converted to WebP format)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qrisName">QRIS Name</Label>
                      <Input
                        id="qrisName"
                        value={paymentSettings.qrisName}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, qrisName: e.target.value })}
                        placeholder="e.g., PT ShortTail Indonesia"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qrisNmid">NMID</Label>
                      <Input
                        id="qrisNmid"
                        value={paymentSettings.qrisNmid}
                        onChange={(e) => setPaymentSettings({ ...paymentSettings, qrisNmid: e.target.value })}
                        placeholder="Enter NMID number"
                      />
                      <p className="text-xs text-muted-foreground">
                        National Merchant ID (NMID) for QRIS
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Loyalty Settings */}
        <TabsContent value="loyalty">
          <div className="grid gap-6">
            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  Points System
                </CardTitle>
                <CardDescription>
                  Configure loyalty points and rewards
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Points System</Label>
                    <p className="text-sm text-muted-foreground">
                      Customers earn points on purchases
                    </p>
                  </div>
                  <Switch
                    checked={loyaltySettings.pointsEnabled}
                    onCheckedChange={(checked) => 
                      setLoyaltySettings({ ...loyaltySettings, pointsEnabled: checked })
                    }
                  />
                </div>

                {loyaltySettings.pointsEnabled && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pointsPerRupiah">Points per IDR spent</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">1 point per</span>
                          <Input
                            id="pointsPerRupiah"
                            type="number"
                            className="w-32"
                            value={loyaltySettings.pointsPerRupiah}
                            onChange={(e) => 
                              setLoyaltySettings({ ...loyaltySettings, pointsPerRupiah: Number(e.target.value) })
                            }
                          />
                          <span className="text-sm text-muted-foreground">IDR</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pointsValue">Point Redemption Value</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">1 point =</span>
                          <Input
                            id="pointsValue"
                            type="number"
                            className="w-32"
                            value={loyaltySettings.pointsValue}
                            onChange={(e) => 
                              setLoyaltySettings({ ...loyaltySettings, pointsValue: Number(e.target.value) })
                            }
                          />
                          <span className="text-sm text-muted-foreground">IDR</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minPointsRedeem">Minimum Points to Redeem</Label>
                        <Input
                          id="minPointsRedeem"
                          type="number"
                          value={loyaltySettings.minPointsRedeem}
                          onChange={(e) => 
                            setLoyaltySettings({ ...loyaltySettings, minPointsRedeem: Number(e.target.value) })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referralBonus">Referral Bonus Points</Label>
                        <Input
                          id="referralBonus"
                          type="number"
                          value={loyaltySettings.referralBonus}
                          onChange={(e) => 
                            setLoyaltySettings({ ...loyaltySettings, referralBonus: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Membership Tiers
                </CardTitle>
                <CardDescription>
                  Configure points required for each tier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-gray-500">Newborn</Badge>
                      <span className="text-sm text-muted-foreground">Starting tier for new members</span>
                    </div>
                    <span className="font-medium">0 points</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-500">Transitional</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={loyaltySettings.tierTransitionalThreshold}
                        onChange={(e) => 
                          setLoyaltySettings({ ...loyaltySettings, tierTransitionalThreshold: Number(e.target.value) })
                        }
                      />
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-500">Juvenile</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={loyaltySettings.tierJuvenileThreshold}
                        onChange={(e) => 
                          setLoyaltySettings({ ...loyaltySettings, tierJuvenileThreshold: Number(e.target.value) })
                        }
                      />
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-500">Adolescence</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={loyaltySettings.tierAdolescenceThreshold}
                        onChange={(e) => 
                          setLoyaltySettings({ ...loyaltySettings, tierAdolescenceThreshold: Number(e.target.value) })
                        }
                      />
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-500">Adulthood</Badge>
                      <span className="text-sm text-muted-foreground">Highest tier</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        className="w-24"
                        value={loyaltySettings.tierAdulthoodThreshold}
                        onChange={(e) => 
                          setLoyaltySettings({ ...loyaltySettings, tierAdulthoodThreshold: Number(e.target.value) })
                        }
                      />
                      <span className="text-sm text-muted-foreground">points</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <div className="grid gap-6">
            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure automated email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send automated emails to customers
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                    }
                  />
                </div>

                {notificationSettings.emailNotifications && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Confirmation</Label>
                          <p className="text-sm text-muted-foreground">Send email when order is placed</p>
                        </div>
                        <Switch
                          checked={notificationSettings.orderConfirmation}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, orderConfirmation: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Shipped</Label>
                          <p className="text-sm text-muted-foreground">Send email when order is shipped</p>
                        </div>
                        <Switch
                          checked={notificationSettings.orderShipped}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, orderShipped: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Delivered</Label>
                          <p className="text-sm text-muted-foreground">Send email when order is delivered</p>
                        </div>
                        <Switch
                          checked={notificationSettings.orderDelivered}
                          onCheckedChange={(checked) => 
                            setNotificationSettings({ ...notificationSettings, orderDelivered: checked })
                          }
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-brown-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Admin Alerts
                </CardTitle>
                <CardDescription>
                  Configure notifications for admin users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alert</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products are running low
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.lowStockAlert}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, lowStockAlert: checked })
                    }
                  />
                </div>

                {notificationSettings.lowStockAlert && (
                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                    <Input
                      id="lowStockThreshold"
                      type="number"
                      value={notificationSettings.lowStockThreshold}
                      onChange={(e) => 
                        setNotificationSettings({ ...notificationSettings, lowStockThreshold: Number(e.target.value) })
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      Alert when stock falls below {notificationSettings.lowStockThreshold} units
                    </p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New User Registration</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a new user signs up</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newUserNotification}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, newUserNotification: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New Review Submitted</Label>
                    <p className="text-sm text-muted-foreground">Get notified when a review needs moderation</p>
                  </div>
                  <Switch
                    checked={notificationSettings.reviewNotification}
                    onCheckedChange={(checked) => 
                      setNotificationSettings({ ...notificationSettings, reviewNotification: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Media Settings */}
        <TabsContent value="social">
          <div className="grid gap-6">
            <Card className="border-brown-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5 text-primary" />
                      Social Media Links
                    </CardTitle>
                    <CardDescription>
                      Manage social media links shown in the footer
                    </CardDescription>
                  </div>
                  <Button onClick={handleOpenAddSocialDialog} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {socialLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="mx-auto h-8 w-8 mb-4 animate-spin" />
                    <p>Loading social media links...</p>
                  </div>
                ) : socialMediaLinks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Share2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No social media links added yet.</p>
                    <p className="text-sm">Click &quot;Add Link&quot; to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {socialMediaLinks
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((link) => (
                        <div
                          key={link.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            link.isActive ? 'bg-white border-brown-200' : 'bg-gray-50 border-gray-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <SocialIcon icon={link.icon} className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-brown-900">{link.platform}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={link.isActive}
                              onCheckedChange={() => handleToggleSocialLink(link.id, link.isActive)}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditSocialDialog(link)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteSocialLink(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Social Media Dialog */}
      <Dialog open={socialDialogOpen} onOpenChange={setSocialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSocialLink ? 'Edit Social Media Link' : 'Add Social Media Link'}
            </DialogTitle>
            <DialogDescription>
              {editingSocialLink
                ? 'Update the social media link details below.'
                : 'Add a new social media link to display in the footer.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="socialPlatform">Platform Name *</Label>
              <Input
                id="socialPlatform"
                placeholder="e.g., Facebook, Instagram"
                value={socialForm.platform}
                onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialUrl">URL *</Label>
              <Input
                id="socialUrl"
                placeholder="https://..."
                value={socialForm.url}
                onChange={(e) => setSocialForm({ ...socialForm, url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socialIcon">Icon</Label>
              <Select
                value={socialForm.icon}
                onValueChange={(value) => setSocialForm({ ...socialForm, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_SOCIAL_ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      <div className="flex items-center gap-2">
                        <SocialIcon icon={icon.value} className="h-4 w-4" />
                        {icon.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Active</Label>
                <p className="text-sm text-muted-foreground">Show this link in the footer</p>
              </div>
              <Switch
                checked={socialForm.isActive}
                onCheckedChange={(checked) => setSocialForm({ ...socialForm, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSocialDialogOpen(false)} disabled={socialSaving}>
              Cancel
            </Button>
            <Button onClick={handleSaveSocialLink} disabled={socialSaving}>
              {socialSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingSocialLink ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
