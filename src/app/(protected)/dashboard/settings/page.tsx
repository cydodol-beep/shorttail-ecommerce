'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useProvinces } from '@/hooks/use-provinces';
import { useCities } from '@/hooks/use-cities';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isValidWebPDataUrl, getAvatarDataInfo } from '@/lib/utils';
import {
  User,
  MapPin,
  Package,
  Key,
  Save,
  Loader2,
  Upload,
  Trophy,
  Gift,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

const tierColors = {
  Newborn: 'bg-gray-500',
  Transitional: 'bg-green-500',
  Juvenile: 'bg-blue-500',
  Adolescence: 'bg-purple-500',
  Adulthood: 'bg-yellow-500',
};

const tierThresholds = {
  Newborn: 0,
  Transitional: 500,
  Juvenile: 2000,
  Adolescence: 5000,
  Adulthood: 10000,
};

export default function UserSettingsPage() {
  const { profile, user, loading: authLoading, refetchProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [copied, setCopied] = useState(false);

  // Profile Info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Personal Address
  const [addressLine1, setAddressLine1] = useState('');
  const [cityId, setCityId] = useState(''); // Stores city_id from RajaOngkir
  const [region, setRegion] = useState(''); // stores province_id
  const [postalCode, setPostalCode] = useState('');

  // Recipient Address
  const [recipientName, setRecipientName] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientCityId, setRecipientCityId] = useState(''); // Stores recipient_city_id
  const [recipientRegion, setRecipientRegion] = useState(''); // stores recipient_province_id
  const [recipientPostalCode, setRecipientPostalCode] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [sameAsPersonal, setSameAsPersonal] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Hooks for Data (RajaOngkir)
  const { provinces, loading: loadingProvinces } = useProvinces();
  
  // Find selected province to get rajaongkir_id for API calls
  const selectedProvince = provinces.find(p => p.id.toString() === region);
  
  // Use mapped ID if available. 
  // IMPORTANT: Do NOT fallback to 'region' immediately if provinces are still loading, 
  // otherwise we fetch wrong data (using internal ID as API ID).
  // Only fallback to 'region' if provinces ARE loaded and we still found nothing (data integrity issue or legacy).
  const selectedRajaOngkirId = selectedProvince?.rajaongkir_province_id?.toString() || (loadingProvinces ? '' : region);

  const selectedRecipientProvince = provinces.find(p => p.id.toString() === recipientRegion);
  const selectedRecipientRajaongkirId = selectedRecipientProvince?.rajaongkir_province_id?.toString() || (loadingProvinces ? '' : recipientRegion);

  const { cities: personalCities, loading: loadingCities } = useCities(selectedRajaOngkirId);
  const { cities: recipientCities, loading: loadingRecipientCities } = useCities(selectedRecipientRajaongkirId);

  // Debug logs for City Data
  useEffect(() => {
    console.log('=== City Debug Info ===');
    console.log('Profile city_id:', profile?.city_id);
    console.log('Profile city name:', profile?.city);
    console.log('State cityId:', cityId);
    console.log('Region (DB ID):', region);
    if (selectedProvince) {
       console.log('Selected Province:', selectedProvince.province_name, 'RajaOngkir ID:', selectedProvince.rajaongkir_province_id);
    }
    console.log('Personal Cities loaded:', personalCities?.length);
    if (personalCities?.length > 0) {
      console.log('First city sample:', personalCities[0]);
      console.log('All city IDs:', personalCities.map(c => c.id));
      const matchingCity = personalCities.find(c => c.id.toString() === cityId);
      console.log('Matching city for cityId', cityId, ':', matchingCity);
    }
    console.log('======================');
  }, [region, personalCities, selectedProvince, cityId, profile]);

  useEffect(() => {
    if (profile) {
      console.log('=== Profile Data Loaded ===');
      console.log('Raw profile.city_id:', profile.city_id, 'Type:', typeof profile.city_id);
      console.log('Raw profile.city:', profile.city);
      console.log('Raw profile.province_id:', profile.province_id, 'Type:', typeof profile.province_id);
      console.log('Raw profile.recipient_city_id:', profile.recipient_city_id);
      console.log('Raw profile.recipient_city:', profile.recipient_city);
      console.log('Full profile object:', profile);
      
      const personalCityIdValue = profile.city_id ? profile.city_id.toString() : '';
      const recipientCityIdValue = profile.recipient_city_id ? profile.recipient_city_id.toString() : '';
      
      console.log('Setting cityId to:', personalCityIdValue);
      console.log('Setting recipientCityId to:', recipientCityIdValue);
      console.log('==========================');
      
      setUserName(profile.user_name || '');
      setUserEmail(profile.user_email || '');
      setUserPhone(profile.user_phoneno || '');
      setAddressLine1(profile.address_line1 || '');
      setCityId(personalCityIdValue);
      setRegion(profile.province_id ? profile.province_id.toString() : '');
      setPostalCode(profile.postal_code || '');
      setRecipientName(profile.recipient_name || '');
      setRecipientAddress(profile.recipient_address_line1 || '');
      setRecipientCityId(recipientCityIdValue);
      setRecipientRegion(profile.recipient_province_id ? profile.recipient_province_id.toString() : '');
      setRecipientPostalCode(profile.recipient_postal_code || '');
      setRecipientPhone(profile.recipient_phoneno || '');
    }
  }, [profile]);

  useEffect(() => {
    if (sameAsPersonal) {
      setRecipientName(userName);
      setRecipientAddress(addressLine1);
      setRecipientCityId(cityId);
      setRecipientRegion(region);
      setRecipientPostalCode(postalCode);
      setRecipientPhone(userPhone);
    }
  }, [sameAsPersonal, userName, addressLine1, cityId, region, postalCode, userPhone]);

  // Update postal code when city changes (if available)
  useEffect(() => {
    if (cityId && personalCities.length > 0) {
      const selectedCity = personalCities.find(c => c.id.toString() === cityId);
      if (selectedCity && selectedCity.postal_code) {
        setPostalCode(selectedCity.postal_code);
      }
    }
  }, [cityId, personalCities]);

   // Update recipient postal code when city changes
   useEffect(() => {
    if (recipientCityId && recipientCities.length > 0) {
      const selectedCity = recipientCities.find(c => c.id.toString() === recipientCityId);
      if (selectedCity && selectedCity.postal_code) {
        setRecipientPostalCode(selectedCity.postal_code);
      }
    }
  }, [recipientCityId, recipientCities]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const supabase = createClient();

      // Convert province IDs to integers
      const provinceId = region ? parseInt(region, 10) : null;
      const recipientProvinceId = recipientRegion ? parseInt(recipientRegion, 10) : null;
      
      // Ensure we find the city logic handles the id property access safely
      const selectedCityData = personalCities.find(c => c.id.toString() === cityId);
      const selectedRecipientCityData = recipientCities.find(c => c.id.toString() === recipientCityId);

      const citySaveValue = selectedCityData?.city_name || (selectedCityData as any)?.name || null;
      console.log('Saving Profile - Personal City:', { cityId, citySaveValue, selectedCityData });

      const recipientCitySaveValue = selectedRecipientCityData?.city_name || (selectedRecipientCityData as any)?.name || null;
      console.log('Saving Profile - Recipient City:', { recipientCityId, recipientCitySaveValue, selectedRecipientCityData });
      
      const { error } = await supabase
        .from('profiles')
        .update({
          user_name: userName,
          user_email: userEmail,
          user_phoneno: userPhone,
          // Personal address fields
          address_line1: addressLine1,
          city: citySaveValue,
          city_id: cityId ? parseInt(cityId, 10) : null,
          province_id: provinceId,
          region_state_province: provinces.find(p => p.id.toString() === region)?.province_name,
          postal_code: postalCode,
          // Recipient/shipping address fields
          recipient_name: recipientName,
          recipient_address_line1: recipientAddress,
          recipient_city: recipientCitySaveValue,
          recipient_city_id: recipientCityId ? parseInt(recipientCityId, 10) : null,
          recipient_province_id: recipientProvinceId,
          recipient_region: provinces.find(p => p.id.toString() === recipientRegion)?.province_name,
          recipient_postal_code: recipientPostalCode,
          recipient_phoneno: recipientPhone,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast.error('Failed to update profile: ' + error.message);
      } else {
        toast.success('Profile and shipping address updated successfully!');
        // Refresh profile to update UI immediately
        if (refetchProfile) {
            refetchProfile();
        }
      }
    } catch (err: any) {
      console.error('Exception updating profile:', err);
      toast.error('Failed to update profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error('Error changing password:', error);
        toast.error('Failed to change password');
      } else {
        toast.success('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Exception changing password:', err);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Create image element to load the file
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = async () => {
        try {
          // Create canvas for WebP conversion
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            toast.error('Failed to process image');
            setUploadingAvatar(false);
            return;
          }

          // Resize to max 400x400 while maintaining aspect ratio
          const maxSize = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP with quality 0.8
          let webpDataUrl = canvas.toDataURL('image/webp', 0.8);

          console.debug('Generated WebP data URL:', {
            length: webpDataUrl.length,
            startsWith: webpDataUrl.substring(0, 50),
            isValid: isValidWebPDataUrl(webpDataUrl)
          });

          // Validate the data URL before storing
          if (!isValidWebPDataUrl(webpDataUrl)) {
            console.error('Generated WebP data URL is invalid:', webpDataUrl.substring(0, 100) + '...');
            toast.error('Failed to process image - invalid format');
            setUploadingAvatar(false);
            return;
          }

          // Update profile with WebP data URL using API route to bypass potential RLS issues
          const response = await fetch('/api/avatar/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              avatarDataUrl: webpDataUrl,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error updating profile avatar:', errorData.error);
            toast.error('Failed to update avatar');
          } else {
            const result = await response.json();
            console.debug('Avatar update response:', result);
            toast.success('Avatar updated successfully');
            // Update the auth context to reflect the new avatar immediately
            refetchProfile();
          }
        } catch (err) {
          console.error('Exception processing avatar:', err);
          toast.error('Failed to process avatar');
        } finally {
          setUploadingAvatar(false);
        }
      };

      img.onerror = () => {
        toast.error('Failed to load image');
        setUploadingAvatar(false);
      };

      reader.onerror = () => {
        toast.error('Failed to read image file');
        setUploadingAvatar(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Exception handling avatar upload:', err);
      toast.error('Failed to upload avatar');
      setUploadingAvatar(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      const referralLink = `${window.location.origin}/ref/${profile.referral_code}`;
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Referral link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getNextTier = () => {
    const tiers = Object.keys(tierThresholds) as Array<keyof typeof tierThresholds>;
    const currentIndex = tiers.indexOf(profile?.tier || 'Newborn');
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  };

  const getPointsToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier) return 0;
    return tierThresholds[nextTier] - (profile?.points_balance || 0);
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900">Settings</h1>
        <p className="text-brown-600">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Profile Summary */}
        <div className="lg:col-span-1">
          <Card className="border-brown-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <Avatar className="h-24 w-24 mb-4">
                    {(() => {
                      const avatarUrl = profile?.user_avatar_url;
                      const avatarInfo = getAvatarDataInfo(avatarUrl);

                      console.debug('Settings Avatar Info:', {
                        urlExists: !!avatarUrl,
                        isValid: avatarInfo.isValid,
                        length: avatarInfo.length,
                        prefix: avatarInfo.prefix
                      });

                      return (
                        <>
                          <AvatarImage
                            src={avatarUrl && isValidWebPDataUrl(avatarUrl) ? avatarUrl : undefined}
                            onError={(e) => {
                              console.error('Settings Avatar image failed to load:', avatarUrl);
                              console.error('Error object:', e);
                            }}
                            className="object-cover"
                            onLoad={() => {
                              console.debug('Settings Avatar image loaded successfully');
                            }}
                          />
                          <AvatarFallback className="bg-primary text-white text-2xl">
                            {profile?.user_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </>
                      );
                    })()}
                  </Avatar>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-4 right-0 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                  />
                </div>
                <h2 className="text-xl font-bold text-brown-900">
                  {profile?.user_name || 'User'}
                </h2>
                <p className="text-sm text-brown-600 mb-2">{profile?.user_email}</p>
                <Badge className={`${tierColors[profile?.tier || 'Newborn']} text-white`}>
                  <Trophy className="h-3 w-3 mr-1" />
                  {profile?.tier || 'Newborn'}
                </Badge>
              </div>

              <Separator className="my-6" />

              {/* Membership Tier Progress */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-brown-900">Membership Level</span>
                  <span className="text-xs text-brown-600">
                    {profile?.points_balance || 0} / {getNextTier() ? tierThresholds[getNextTier()!] : tierThresholds.Adulthood} pts
                  </span>
                </div>
                
                {/* Tier Progress Bar */}
                <div className="relative">
                  {/* Background track */}
                  <div className="h-3 bg-brown-100 rounded-full overflow-hidden">
                    {/* Progress fill */}
                    <div 
                      className={`h-full ${tierColors[profile?.tier || 'Newborn']} transition-all duration-500`}
                      style={{ 
                        width: `${Math.min(100, ((profile?.points_balance || 0) / (getNextTier() ? tierThresholds[getNextTier()!] : tierThresholds.Adulthood)) * 100)}%` 
                      }}
                    />
                  </div>
                  
                  {/* Tier markers */}
                  <div className="relative mt-2">
                    <div className="flex justify-between">
                      {Object.entries(tierThresholds).map(([tier, points], index) => {
                        const currentPoints = profile?.points_balance || 0;
                        const isAchieved = currentPoints >= points;
                        const isCurrent = profile?.tier === tier;
                        
                        return (
                          <div key={tier} className="flex flex-col items-center" style={{ width: '20%' }}>
                            <div 
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mb-1 transition-all ${
                                isAchieved 
                                  ? `${tierColors[tier as keyof typeof tierColors]} border-transparent` 
                                  : 'bg-white border-brown-300'
                              } ${isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                            >
                              {isAchieved && (
                                <Trophy className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <span className={`text-[10px] font-medium text-center leading-tight ${
                              isCurrent ? 'text-primary' : isAchieved ? 'text-brown-900' : 'text-brown-400'
                            }`}>
                              {tier}
                            </span>
                            <span className="text-[9px] text-brown-500">
                              {points.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {getNextTier() && (
                  <p className="text-xs text-brown-600 text-center">
                    <span className="font-medium">{getPointsToNextTier()} points</span> needed to reach <span className="font-semibold">{getNextTier()}</span>
                  </p>
                )}
              </div>

              {/* Membership Info */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-brown-600">Points Balance</span>
                    <span className="text-lg font-bold text-primary">
                      {profile?.points_balance || 0} pts
                    </span>
                  </div>
                  {getNextTier() && (
                    <p className="text-xs text-brown-500">
                      {getPointsToNextTier()} points to {getNextTier()}
                    </p>
                  )}
                </div>

                {/* Referral Code */}
                <div>
                  <Label className="text-sm text-brown-600 mb-2 block">
                    <Gift className="inline h-4 w-4 mr-1" />
                    Your Referral Code
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={profile?.referral_code || ''}
                      readOnly
                      className="text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyReferralCode}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-brown-500 mt-1">
                    Share this link to earn referral points
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Settings Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="shipping">
                <MapPin className="h-4 w-4 mr-2" />
                Shipping
              </TabsTrigger>
              <TabsTrigger value="security">
                <Key className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="user_name">Full Name *</Label>
                      <Input
                        id="user_name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="user_email">Email</Label>
                      <Input
                        id="user_email"
                        type="email"
                        value={userEmail}
                        onChange={(e) => setUserEmail(e.target.value)}
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="user_phone">Phone Number *</Label>
                    <Input
                      id="user_phone"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="+62 812 3456 7890"
                    />
                  </div>

                  <Separator />

                  <h3 className="text-lg font-semibold text-brown-900">Personal Address</h3>

                  <div>
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="region">Province/State</Label>
                      <Select
                        value={region}
                        onValueChange={(val) => {
                          setRegion(val);
                          setCityId(''); // Reset city when province changes
                        }}
                      >
                        <SelectTrigger id="region" className="w-full !bg-white !text-black border-slate-300" style={{ backgroundColor: 'white', color: 'black' }}>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white !text-black border-slate-200 max-h-[200px]" style={{ backgroundColor: 'white', color: 'black' }}>
                          {loadingProvinces ? (
                             <SelectItem disabled value="loading" className="!text-gray-500">Loading provinces...</SelectItem>
                          ) : provinces.length > 0 ? (
                            provinces.map((province) => (
                            <SelectItem 
                              key={province.id} 
                              value={province.id.toString()}
                              className="!text-black hover:bg-slate-100 focus:bg-slate-100 focus:text-black cursor-pointer"
                              style={{ color: 'black' }}
                            >
                              {province.province_name}
                            </SelectItem>
                          ))
                          ) : (
                             <SelectItem disabled value="empty" className="!text-gray-500">No provinces found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Select
                        value={cityId}
                        onValueChange={setCityId}
                        disabled={!region}
                      >
                        <SelectTrigger id="city" className="w-full !bg-white !text-black border-slate-300" style={{ backgroundColor: 'white', color: 'black' }}>
                          <SelectValue placeholder="Select city">
                            {(() => {
                              console.log('SelectValue rendering - cityId:', cityId, 'personalCities:', personalCities.length);
                              
                              // First, try to find city in loaded cities list
                              const foundCity = personalCities.find(c => c.id.toString() === cityId);
                              if (foundCity) {
                                console.log('Found city in API list:', foundCity);
                                return `${foundCity.type || ''} ${foundCity.city_name || (foundCity as any).name || ''}`.trim();
                              }
                              
                              // If not found in loaded list but we have a cityId and profile has the city name, show from profile
                              if (cityId && profile?.city_id?.toString() === cityId && profile.city) {
                                console.log('Showing city from profile:', profile.city);
                                return profile.city;
                              }
                              
                              console.log('No city found, showing placeholder');
                              // Default placeholder
                              return "Select city";
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="!bg-white !text-black border-slate-200 max-h-[200px]" style={{ backgroundColor: 'white', color: 'black' }}>
                          {loadingCities ? (
                             <SelectItem disabled value="loading" className="!text-gray-500">Loading cities...</SelectItem>
                          ) : (
                            <>
                              {/* Always show saved city first if it exists and is not in the loaded list */}
                              {(() => {
                                const hasSavedCity = cityId && profile?.city;
                                const cityInList = personalCities.find(c => c.id.toString() === cityId);
                                const shouldShowSaved = hasSavedCity && !cityInList;
                                
                                console.log('Should show saved city?', {
                                  hasSavedCity,
                                  cityInList: !!cityInList,
                                  shouldShowSaved,
                                  cityId,
                                  savedCityName: profile?.city
                                });
                                
                                if (shouldShowSaved) {
                                  return (
                                    <SelectItem value={cityId} className="!text-black bg-blue-50" style={{ color: 'black' }}>
                                      {profile.city} (Current - Saved)
                                    </SelectItem>
                                  );
                                }
                                return null;
                              })()}
                              
                              {/* Show all loaded cities */}
                              {personalCities.length > 0 ? (
                                personalCities.map((c) => (
                                  <SelectItem 
                                    key={c.id} 
                                    value={c.id.toString()}
                                    className="!text-black hover:bg-slate-100 focus:bg-slate-100 focus:text-black cursor-pointer"
                                    style={{ color: 'black' }}
                                  >
                                    <span className="!text-black !opacity-100" style={{ color: 'black', fontWeight: 500 }}>
                                      {c.type || ''} {c.city_name || (c as any).name || ''}
                                    </span>
                                  </SelectItem>
                                ))
                              ) : !cityId || !profile?.city ? (
                                <SelectItem disabled value="empty" className="!text-gray-500">No cities found (Select Province)</SelectItem>
                              ) : null}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postal Code</Label>
                      <Input
                        id="postal_code"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full md:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shipping Tab */}
            <TabsContent value="shipping">
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                  <CardDescription>
                    Set up your default shipping address for orders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="same_as_personal"
                      checked={sameAsPersonal}
                      onChange={(e) => setSameAsPersonal(e.target.checked)}
                      className="h-4 w-4 rounded border-brown-300"
                    />
                    <Label htmlFor="same_as_personal">Same as personal address</Label>
                  </div>

                  {!sameAsPersonal && (
                  <>
                    <div>
                        <Label htmlFor="recipient_name">Recipient Name</Label>
                        <Input
                            id="recipient_name"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="Recipient Name"
                        />
                    </div>
                    <div>
                        <Label htmlFor="recipient_address">Address Line 1</Label>
                         <Input
                          id="recipient_address"
                          value={recipientAddress}
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="Street address"
                        />
                    </div>
                  </>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recipient_region">Province/State</Label>
                      <Select
                        value={recipientRegion}
                        onValueChange={(val) => {
                          setRecipientRegion(val);
                          setRecipientCityId('');
                        }}
                        disabled={sameAsPersonal}
                      >
                        <SelectTrigger id="recipient_region" className="w-full !bg-white !text-black border-slate-300" style={{ backgroundColor: 'white', color: 'black' }}>
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent className="!bg-white !text-black border-slate-200 max-h-[200px]" style={{ backgroundColor: 'white', color: 'black' }}>
                           {loadingProvinces ? (
                             <SelectItem disabled value="loading" className="!text-gray-500">Loading provinces...</SelectItem>
                          ) : provinces.length > 0 ? (
                             provinces.map((province) => (
                            <SelectItem 
                              key={province.id} 
                              value={province.id.toString()}
                              className="!text-black hover:bg-slate-100 focus:bg-slate-100 focus:text-black cursor-pointer"
                              style={{ color: 'black' }}
                            >
                              {province.province_name}
                            </SelectItem>
                          ))
                          ) : (
                             <SelectItem disabled value="empty" className="!text-gray-500">No provinces found</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="recipient_city">City</Label>
                      <Select
                         value={recipientCityId}
                         onValueChange={setRecipientCityId}
                         disabled={sameAsPersonal || !recipientRegion}
                      >
                        <SelectTrigger id="recipient_city" className="w-full !bg-white !text-black border-slate-300" style={{ backgroundColor: 'white', color: 'black' }}>
                          <SelectValue placeholder="Select city">
                             {(() => {
                              // First, try to find city in loaded cities list
                              const foundCity = recipientCities.find(c => c.id.toString() === recipientCityId);
                              if (foundCity) {
                                return `${foundCity.type || ''} ${foundCity.city_name || (foundCity as any).name || ''}`.trim();
                              }
                              
                              // If not found in loaded list but we have a recipientCityId and profile has the city name, show from profile
                              if (recipientCityId && profile?.recipient_city_id?.toString() === recipientCityId && profile.recipient_city) {
                                return profile.recipient_city;
                              }
                              
                              // Default placeholder
                              return "Select city";
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="!bg-white !text-black border-slate-200 max-h-[200px]" style={{ backgroundColor: 'white', color: 'black' }}>
                            {loadingRecipientCities ? (
                             <SelectItem disabled value="loading" className="!text-gray-500">Loading cities...</SelectItem>
                            ) : (
                              <>
                                {/* Always show saved city first if it exists and is not in the loaded list */}
                                {recipientCityId && profile?.recipient_city && !recipientCities.find(c => c.id.toString() === recipientCityId) && (
                                  <SelectItem value={recipientCityId} className="!text-black" style={{ color: 'black' }}>
                                    {profile.recipient_city} (Current)
                                  </SelectItem>
                                )}
                                
                                {/* Show all loaded cities */}
                                {recipientCities.length > 0 ? (
                                  recipientCities.map((c) => (
                                    <SelectItem 
                                      key={c.id} 
                                      value={c.id.toString()}
                                      className="!text-black hover:bg-slate-100 focus:bg-slate-100 focus:text-black cursor-pointer"
                                      style={{ color: 'black' }}
                                    >
                                      <span className="!text-black !opacity-100" style={{ color: 'black', fontWeight: 500 }}>
                                        {c.type || ''} {c.city_name || (c as any).name || ''}
                                      </span>
                                    </SelectItem>
                                  ))
                                ) : recipientCityId && profile?.recipient_city ? (
                                  // Show the saved city from database if API cities haven't loaded yet and it wasn't shown above
                                  !recipientCities.find(c => c.id.toString() === recipientCityId) && (
                                    <SelectItem value={recipientCityId} className="!text-black" style={{ color: 'black' }}>
                                      {profile.recipient_city}
                                    </SelectItem>
                                  )
                                ) : (
                                  <SelectItem disabled value="empty" className="!text-gray-500">No cities found</SelectItem>
                                )}
                              </>
                            )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recipient_phone">Phone Number</Label>
                    <Input
                      id="recipient_phone"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="Recipient phone number"
                      disabled={sameAsPersonal}
                    />
                  </div>

                  <div>
                      <Label htmlFor="recipient_postal_code">Postal Code</Label>
                      <Input
                        id="recipient_postal_code"
                        value={recipientPostalCode}
                        onChange={(e) => setRecipientPostalCode(e.target.value)}
                        placeholder="12345"
                        disabled={sameAsPersonal}
                      />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full md:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Package className="mr-2 h-4 w-4" />
                        Save Shipping Address
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current_password">Current Password</Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min 6 characters)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full md:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
