'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Heart,
  PawPrint,
  Gift,
  Settings,
  ChevronRight,
  Trophy,
  TrendingUp
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { StoreLogo } from '@/components/ui/store-logo';
import { createClient } from '@/lib/supabase/client';
import { generateInvoiceJPEG } from '@/lib/invoice-generator';
import { useStoreSettingsStore } from '@/store/store-settings-store';
import type { Order, Pet } from '@/types/database';

const tierThresholds = {
  Newborn: 0,
  Transitional: 500,
  Juvenile: 2000,
  Adolescence: 5000,
  Adulthood: 10000,
};

const tierColors = {
  Newborn: 'bg-gray-500',
  Transitional: 'bg-green-500',
  Juvenile: 'bg-blue-500',
  Adolescence: 'bg-purple-500',
  Adulthood: 'bg-yellow-500',
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

function generateReferralCode(userId: string): string {
  const prefix = 'ST';
  const hash = userId.slice(0, 6).toUpperCase();
  return `${prefix}${hash}`;
}

export default function DashboardPage() {
  const { profile, user, refetchProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    
    const [ordersRes, petsRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('pets')
        .select('*')
        .eq('owner_id', user.id),
    ]);

    setOrders(ordersRes.data || []);
    setPets(petsRes.data || []);
    setLoading(false);
  }, [user]);

  // Generate referral code if not exists
  useEffect(() => {
    const ensureReferralCode = async () => {
      if (!user || !profile) return;
      
      if (profile.referral_code) {
        setReferralCode(profile.referral_code);
        return;
      }
      
      // Generate and save referral code
      const supabase = createClient();
      const newCode = generateReferralCode(user.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({ referral_code: newCode })
        .eq('id', user.id);
      
      if (!error) {
        setReferralCode(newCode);
        refetchProfile?.();
      }
    };
    
    ensureReferralCode();
  }, [user, profile, refetchProfile]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const getNextTier = () => {
    const tiers = Object.keys(tierThresholds) as Array<keyof typeof tierThresholds>;
    const currentIndex = tiers.indexOf(profile?.tier || 'Newborn');
    if (currentIndex < tiers.length - 1) {
      return tiers[currentIndex + 1];
    }
    return null;
  };

  const getProgressToNextTier = () => {
    const currentPoints = profile?.points_balance || 0;
    const currentTierPoints = tierThresholds[profile?.tier || 'Newborn'];
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    const nextTierPoints = tierThresholds[nextTier];
    const progress = ((currentPoints - currentTierPoints) / (nextTierPoints - currentTierPoints)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brown-900">Dashboard</h1>
        <p className="text-brown-600">Welcome back, {profile?.user_name || 'User'}!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Membership */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border-brown-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={profile?.user_avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {profile?.user_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-bold text-brown-900">
                  {profile?.user_name || 'User'}
                </h2>
                <p className="text-sm text-brown-600">{profile?.user_email}</p>
                <Badge 
                  className={`mt-2 ${tierColors[profile?.tier || 'Newborn']} text-white`}
                >
                  <Trophy className="h-3 w-3 mr-1" />
                  {profile?.tier || 'Newborn'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Membership Progress */}
          <Card className="border-brown-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Membership Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
                    <span className="font-medium">{tierThresholds[getNextTier()!] - (profile?.points_balance || 0)} points</span> needed to reach <span className="font-semibold">{getNextTier()}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Referral Code */}
          <Card className="border-brown-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Referral Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-brown-600 mb-3">
                Share your code and earn points when friends join!
              </p>
              <div className="p-3 bg-brown-50 rounded-lg text-center">
                <code className="text-lg font-mono font-bold text-primary">
                  {referralCode || profile?.referral_code || 'Generating...'}
                </code>
              </div>
              <Button 
                className="w-full mt-3" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const code = referralCode || profile?.referral_code;
                  if (code) {
                    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${code}`);
                  }
                }}
                disabled={!referralCode && !profile?.referral_code}
              >
                Copy Referral Link
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Orders & Pets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/orders">
              <Card className="border-brown-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <ShoppingBag className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium text-brown-900">Orders</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/pets">
              <Card className="border-brown-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <div className="w-8 h-8 mx-auto mb-2">
                    <StoreLogo className="w-full h-full" iconClassName="h-8 w-8 text-primary" fallbackSize="lg" />
                  </div>
                  <p className="font-medium text-brown-900">My Pets</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/wishlist">
              <Card className="border-brown-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium text-brown-900">Wishlist</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/settings">
              <Card className="border-brown-200 hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6 text-center">
                  <Settings className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-medium text-brown-900">Settings</p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Orders */}
          <Card className="border-brown-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest purchases</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/orders">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 text-brown-300 mx-auto mb-3" />
                  <p className="text-brown-600">No orders yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/products">Start Shopping</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-4 bg-brown-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-brown-900">
                            Order #{order.id.slice(0, 8)}
                          </p>
                          <Badge variant="outline" className="capitalize text-xs px-2 py-0 h-6">
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-brown-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right mr-4">
                          <p className="font-bold text-primary">
                            {formatPrice(order.total_amount)}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={async () => {
                            // Generate invoice preview
                            try {
                              const supabase = createClient();

                              // Fetch the order with items to generate invoice
                              // First get the order
                              const { data: orderData, error: orderError } = await supabase
                                .from('orders')
                                .select('id, user_id, cashier_id, source, status, subtotal, shipping_fee, discount_amount, total_amount, recipient_name, recipient_phone, recipient_address, recipient_province, shipping_courier, shipping_courier_name, shipping_address_snapshot, customer_notes, created_at, updated_at')
                                .eq('id', order.id)
                                .single();

                              if (orderError) throw orderError;

                              // Then get the order items
                              const { data: itemsData, error: itemsError } = await supabase
                                .from('order_items')
                                .select('product_id, variant_id, quantity, price_at_purchase')
                                .eq('order_id', order.id);

                              if (itemsError) throw itemsError;

                              // For each item, get product and variant details
                              let itemsWithDetails = [];
                              if (itemsData && itemsData.length > 0) {
                                for (const item of itemsData) {
                                  // Get product details
                                  const { data: productData, error: productError } = await supabase
                                    .from('products')
                                    .select('name, sku')
                                    .eq('id', item.product_id)
                                    .single();

                                  let productDetails = {
                                    name: 'Unknown Product',
                                    sku: undefined
                                  };

                                  if (!productError && productData) {
                                    productDetails = {
                                      name: productData.name,
                                      sku: productData.sku
                                    };
                                  }

                                  // Get variant details if exists
                                  let variantDetails = {
                                    name: null,
                                    sku: null
                                  };

                                  if (item.variant_id) {
                                    const { data: variantData, error: variantError } = await supabase
                                      .from('product_variants')
                                      .select('variant_name, sku')
                                      .eq('id', item.variant_id)
                                      .single();

                                    if (!variantError && variantData) {
                                      variantDetails = {
                                        name: variantData.variant_name,
                                        sku: variantData.sku
                                      };
                                    }
                                  }

                                  itemsWithDetails.push({
                                    product_id: item.product_id,
                                    product_name: productDetails.name,
                                    product_sku: productDetails.sku,
                                    variant_id: item.variant_id,
                                    variant_name: variantDetails.name,
                                    variant_sku: variantDetails.sku,
                                    quantity: item.quantity,
                                    price_at_purchase: item.price_at_purchase,
                                  });
                                }
                              }

                              // Get user profile to get the user name
                              let userName = '';
                              if (orderData.user_id) {
                                const { data: profileData, error: profileError } = await supabase
                                  .from('profiles')
                                  .select('user_name')
                                  .eq('id', orderData.user_id)
                                  .single();

                                if (!profileError && profileData) {
                                  userName = profileData.user_name || '';
                                }
                              }

                              // Get store settings for invoice generation
                              const { allSettings } = useStoreSettingsStore.getState();
                              const storeSettings = {
                                store_name: allSettings?.store?.storeName || 'ShortTail.id',
                                store_logo: allSettings?.store?.storeLogo || '',
                                store_address: allSettings?.store?.storeAddress || '',
                                store_phone: allSettings?.store?.storePhone || '',
                                store_email: allSettings?.store?.storeEmail || '',
                              };

                              // Format the order data to match the expected structure for the invoice generator
                              const orderForInvoice = {
                                id: orderData.id,
                                user_id: orderData.user_id || undefined,
                                cashier_id: orderData.cashier_id || undefined,
                                user_name: userName,
                                source: orderData.source,
                                status: orderData.status,
                                subtotal: orderData.subtotal,
                                shipping_fee: orderData.shipping_fee,
                                discount_amount: orderData.discount_amount,
                                total_amount: orderData.total_amount,
                                recipient_name: orderData.recipient_name || (orderData.shipping_address_snapshot as any)?.recipient_name || '',
                                recipient_phone: orderData.recipient_phone || (orderData.shipping_address_snapshot as any)?.phone || '',
                                recipient_address: orderData.recipient_address || (orderData.shipping_address_snapshot as any)?.address_line1 || '',
                                recipient_province: orderData.recipient_province || (orderData.shipping_address_snapshot as any)?.province || '',
                                shipping_courier: orderData.shipping_courier || orderData.shipping_courier_name || '',
                                shipping_courier_name: orderData.shipping_courier_name || '',
                                shipping_address_snapshot: orderData.shipping_address_snapshot,
                                customer_notes: orderData.customer_notes || '',
                                items_count: itemsWithDetails.length,
                                items: itemsWithDetails,
                                created_at: orderData.created_at,
                                updated_at: orderData.updated_at,
                              };

                              // Generate the invoice
                              const invoiceBlob = await generateInvoiceJPEG(orderForInvoice, storeSettings);

                              // Create a temporary URL for the preview
                              const url = URL.createObjectURL(invoiceBlob);

                              // Open the invoice in a new tab
                              window.open(url, '_blank');

                              // Clean up the object URL after a delay
                              setTimeout(() => URL.revokeObjectURL(url), 10000);
                            } catch (error) {
                              console.error('Error generating invoice:', error);
                              alert('Error generating invoice. Please try again.');
                            }
                          }}
                        >
                          Invoice
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          asChild
                        >
                          <Link href={`/dashboard/orders/${order.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Pets */}
          <Card className="border-brown-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>My Pets</CardTitle>
                <CardDescription>Your registered companions</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/pets">
                  Manage
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pets.length === 0 ? (
                <div className="text-center py-8">
                  <PawPrint className="h-12 w-12 text-brown-300 mx-auto mb-3" />
                  <p className="text-brown-600">No pets registered yet</p>
                  <Button className="mt-4" asChild>
                    <Link href="/dashboard/pets/new">Add Your Pet</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center gap-3 p-4 bg-brown-50 rounded-lg"
                    >
                      <div className="h-12 w-12 bg-brown-200 rounded-full flex items-center justify-center">
                        {pet.pet_image_url ? (
                          <img
                            src={pet.pet_image_url}
                            alt={pet.pet_name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <PawPrint className="h-6 w-6 text-brown-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-brown-900">{pet.pet_name}</p>
                        <p className="text-sm text-brown-600 capitalize">{pet.pet_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
