'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronLeft,
  Truck,
  CreditCard,
  MapPin,
  Package,
  Loader2,
  PawPrint,
  ShieldCheck,
  Tag,
  QrCode
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCartStore } from '@/store/cart-store';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { RelatedProducts } from '@/components/products/related-products';
import { generateInvoiceJPEG, downloadInvoice } from '@/lib/invoice-generator';
import { useStoreSettingsStore } from '@/store/store-settings-store';
import { usePromotionsStore } from '@/store/promotions-store';
import { Promotion } from '@/store/promotions-store';

const checkoutSchema = z.object({
  recipient_name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address_line1: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province is required'),
  postal_code: z.string().min(5, 'Postal code is required'),
  courier: z.string().min(1, 'Please select a courier'),
  customer_notes: z.string().optional(),
  promotion_code: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

// Fetch provinces for shipping calculator
async function fetchProvinces() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('provinces')
    .select('id, province_name')
    .eq('is_active', true)
    .order('province_name');

  if (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }

  return data?.map((province: { id: number; province_name: string }) => ({
    id: province.id,
    name: province.province_name
  })) || [];
}

// Define shipping courier type
type ShippingCourier = {
  id: string;
  name: string;
  price: number;
  eta: string;
};

// Calculate shipping rates based on destination province and weight
async function calculateShippingRates(destinationProvinceId: number, totalWeightGrams: number): Promise<ShippingCourier[]> {
  const supabase = createClient();

  // Get shipping rates that match the destination province, joining with couriers table
  const { data: ratesData, error } = await supabase
    .from('shipping_rates')
    .select(`
      id,
      courier_id,
      province_id,
      cost,
      estimated_days,
      shipping_couriers!inner (
        id,
        courier_name,
        is_active
      )
    `)
    .eq('province_id', destinationProvinceId)
    .eq('shipping_couriers.is_active', true); // Only get active couriers

  if (error) {
    console.error('Error calculating shipping rates:', error);
    // Fallback to static rates if calculation fails
    return staticCouriers;
  }

  // If no rates found for this province, return static couriers
  if (!ratesData || ratesData.length === 0) {
    return staticCouriers;
  }

  // Calculate rates based on weight (similar logic to POS)
  const calculatedCouriers = ratesData.map((rate: any) => {
    // Get base rate cost from shipping_rates table
    let cost = parseFloat(rate.cost) || 0;

    // If weight is more than 1kg, calculate per-kg rate
    if (totalWeightGrams > 1000) {
      const weightInKg = Math.ceil(totalWeightGrams / 1000);
      cost = cost * weightInKg;
    }
    // If under 1kg, use base rate (which is already set above)

    // Return the correct structure for ShippingCourier type
    return {
      id: rate.shipping_couriers.id?.toString() || rate.courier_id?.toString() || '',
      name: rate.shipping_couriers.courier_name || 'Unknown Courier',
      price: cost,
      eta: rate.estimated_days ? `${rate.estimated_days} days` : '1-2 days'
    };
  });

  return calculatedCouriers;
}

// Fetch available payment methods from payment_methods table
async function fetchDirectPaymentMethods() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('is_active', true)
    .eq('is_available', true) // Only fetch methods available to customers
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }

  return [];
}

// Fetch available payment methods based on store settings
async function fetchPaymentMethods() {
  const supabase = createClient();

  // Get store settings
  const { data: settings, error: settingsError } = await supabase
    .from('store_settings')
    .select('bank_transfer_enabled, bank_name, bank_account_number, bank_account_name, ewallet_enabled, ewallet_provider, ewallet_number, qris_enabled, qris_name')
    .single();

  if (settingsError) {
    console.error('Error fetching store settings for payment methods:', settingsError);
    // Return default payment methods if store settings fetch fails
    return [
      { id: 'bank_transfer', name: 'Bank Transfer', description: 'Transfer payment via bank', enabled: true },
    ];
  }

  const paymentMethods = [];

  if (settings?.bank_transfer_enabled) {
    paymentMethods.push({
      id: 'bank_transfer',
      name: 'Bank Transfer',
      description: `Pay via ${settings.bank_name || 'Bank'}: ${settings.bank_account_number || 'Account'} a.n. ${settings.bank_account_name || 'Account Name'}`,
      enabled: true,
    });
  }

  if (settings?.ewallet_enabled) {
    paymentMethods.push({
      id: 'ewallet',
      name: 'E-Wallet',
      description: `Pay via ${settings.ewallet_provider || 'E-Wallet'}: ${settings.ewallet_number || 'Number'}`,
      enabled: true,
    });
  }

  if (settings?.qris_enabled) {
    paymentMethods.push({
      id: 'qris',
      name: 'QRIS',
      description: `QRIS Payment${settings.qris_name ? ` - ${settings.qris_name}` : ''}`,
      enabled: true,
    });
  }

  return paymentMethods;
}

// This will be dynamically populated based on selected province
const staticCouriers: ShippingCourier[] = [
  { id: 'jne-reg', name: 'JNE Regular', price: 25000, eta: '3-5 days' },
  { id: 'jne-yes', name: 'JNE YES', price: 35000, eta: '1-2 days' },
  { id: 'jnt-express', name: 'J&T Express', price: 22000, eta: '2-4 days' },
  { id: 'sicepat', name: 'SiCepat REG', price: 20000, eta: '2-3 days' },
];

// Type for promotion validation result
type PromotionValidationResult = {
  is_valid: boolean;
  discount_amount: number;
  free_shipping: boolean;
  discount_type: string;
  discount_value: number;
  buy_quantity?: number;
  get_quantity?: number;
  min_purchase_amount?: number;
  code: string;
  description: string;
  message: string;
};

// Function to validate promotion code
async function validatePromotionCode(code: string, userId: string, productIds: string[], subtotal: number): Promise<PromotionValidationResult | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .rpc('validate_promotion_code', {
      p_code: code,
      p_user_id: userId,
      p_product_ids: productIds,
      p_subtotal: subtotal
    });

  if (error) {
    console.error('Error validating promotion:', error);
    return null;
  }

  return (data?.[0] as PromotionValidationResult) || null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const { items, getTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [dynamicCouriers, setDynamicCouriers] = useState(staticCouriers);
  const [selectedCourier, setSelectedCourier] = useState<ShippingCourier | null>(null);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [provinces, setProvinces] = useState<{ id: number; name: string }[]>([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [promotionCode, setPromotionCode] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<any>(null);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [promotionError, setPromotionError] = useState('');
  const [storePaymentSettings, setStorePaymentSettings] = useState<any>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{ id: string; name: string; description: string } | null>(null);

  // New state for shop promotions section
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [promotionsLoading, setPromotionsLoading] = useState(true);
  const promotionsStore = usePromotionsStore();

  // State for order preview step
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [previewOrderData, setPreviewOrderData] = useState<any>(null);

  const form = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      // Set default values to empty initially, will be updated via useEffect when profile loads
      recipient_name: '',
      phone: '',
      address_line1: '',
      city: '',
      province: '',
      postal_code: '',
      courier: '',
      customer_notes: '',
      promotion_code: '',
    },
  });

  // Update form values when profile data becomes available
  useEffect(() => {
    if (profile) {
      // Set form values based on profile data
      const formValues = {
        // Load recipient data first, fallback to user data if no recipient data exists
        recipient_name: profile.recipient_name || profile.user_name || '',
        // Use recipient phone if exists, otherwise use user's phone
        phone: profile.recipient_phoneno || profile.user_phoneno || '',
        // Use recipient address if exists, otherwise use user's address
        address_line1: profile.recipient_address_line1 || profile.address_line1 || '',
        city: profile.recipient_city || profile.city || '',
        province: profile.recipient_region || profile.region_state_province || '',
        postal_code: profile.recipient_postal_code || profile.postal_code || '',
        courier: '',
        customer_notes: '',
        promotion_code: '',
      };

      form.reset(formValues);

      // Update the selectedProvince state based on the province value
      if (formValues.province) {
        const matchedProvince = provinces.find((prov: { id: number; name: string }) =>
          prov.name.toLowerCase().includes(formValues.province.toLowerCase()) ||
          formValues.province.toLowerCase().includes(prov.name.toLowerCase())
        );
        if (matchedProvince) {
          setSelectedProvince(matchedProvince.id.toString());
        }
      }
    }
  }, [profile, form, provinces]);

  useEffect(() => {
    // Don't redirect while auth state is loading/stabilizing
    if (!authLoading && !user) {
      router.push('/login?redirect=/checkout');
    }
    if (!authLoading && items.length === 0) {
      router.push('/cart');
    }
  }, [user, authLoading, items.length, router]);

  // Load payment methods and store settings when user is authenticated
  useEffect(() => {
    if (!user) return; // Only load payment methods if user is authenticated

    const loadPaymentMethods = async () => {
      try {
        const methods = await fetchPaymentMethods();
        setAvailablePaymentMethods(methods);

        // Also fetch the complete store settings to get QRIS info
        const supabase = createClient();
        const { data: settings, error: settingsError } = await supabase
          .from('store_settings')
          .select('*')
          .single();

        if (settingsError) {
          console.error('Error fetching store settings:', settingsError);
        } else {
          setStorePaymentSettings(settings);
        }
      } catch (error) {
        console.error('Error loading payment methods:', error);
        // Don't show error to user, just log it - they can still proceed with order
      }
    };

    loadPaymentMethods();
  }, [user]);

  // Set up field value watchers for province changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'province' && value.province) {
        // Find the matching province ID based on the name
        const matchedProvince = provinces.find((prov: { id: number; name: string }) =>
          prov.name.toLowerCase().includes(value.province?.toLowerCase() || '') ||
          (value.province || '').toLowerCase().includes(prov.name.toLowerCase())
        );
        if (matchedProvince && matchedProvince.id.toString() !== selectedProvince) {
          setSelectedProvince(matchedProvince.id.toString());
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [form, provinces, selectedProvince]);

  // Set up a reverse watcher to update form when selectedProvince changes (for pre-selection from profile)
  useEffect(() => {
    if (selectedProvince && provinces.length > 0) {
      const matchedProvince = provinces.find((prov: { id: number; name: string }) =>
        prov.id.toString() === selectedProvince
      );
      if (matchedProvince && form.getValues('province') !== matchedProvince.name) {
        form.setValue('province', matchedProvince.name);
      }
    }
  }, [selectedProvince, provinces, form]);

  // Fetch provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      const fetchedProvinces = await fetchProvinces();
      setProvinces(fetchedProvinces);
    };

    loadProvinces();
  }, []);

  // Set the initial province from the profile when both profile and provinces are available
  useEffect(() => {
    if (profile && provinces.length > 0) {
      // Prioritize recipient_province_id from profile if available
      const recipientProvinceId = profile.recipient_province_id;
      const regionProvince = profile.recipient_region || profile.region_state_province || '';

      let matchedProvince: { id: number; name: string } | undefined;

      if (recipientProvinceId) {
        // Use the ID directly if available
        matchedProvince = provinces.find((prov: { id: number; name: string }) =>
          prov.id === recipientProvinceId
        );
      } else if (regionProvince) {
        // Fallback to name matching if no ID
        matchedProvince = provinces.find((prov: { id: number; name: string }) =>
          prov.name.toLowerCase().includes(regionProvince.toLowerCase()) ||
          regionProvince.toLowerCase().includes(prov.name.toLowerCase())
        );
      }

      if (matchedProvince) {
        setSelectedProvince(matchedProvince.id.toString());
        // Also update the form value to match the province name
        form.setValue('province', matchedProvince.name);
      }
    }
  }, [profile, provinces, form]);

  const subtotal = getTotal();

  // Fetch available promotions on component mount
  useEffect(() => {
    if (!user) return;

    const fetchPromotions = async () => {
      setPromotionsLoading(true);
      await promotionsStore.fetchPromotions();
      const allPromotions = promotionsStore.promotions;

      // Filter to get only active promotions that can be applied to this cart
      const applicablePromotions = allPromotions.filter(promo => {
        if (!promo.is_active) return false;
        if (promo.start_date && new Date(promo.start_date) > new Date()) return false;
        if (promo.end_date && new Date(promo.end_date) < new Date()) return false;
        if (promo.min_purchase_amount && subtotal < promo.min_purchase_amount) return false;

        // Check if promotion applies to cart items
        if (promo.applies_to === 'specific_products') {
          const cartProductIds = items.map(item => item.product.id);
          if (promo.product_ids && promo.product_ids.length > 0) {
            // Check if any of the cart products match the promotion products
            const hasMatchingProduct = cartProductIds.some(cartId =>
              promo.product_ids?.includes(cartId)
            );
            if (!hasMatchingProduct) return false;
          }
        }

        // Check max uses per user
        if (promo.max_uses_per_user) {
          // In a real implementation, you'd check the promotion_usage table
          // For now, we'll just show the promotion and validate on application
        }

        return true;
      });

      setAvailablePromotions(applicablePromotions);
      setPromotionsLoading(false);
    };

    fetchPromotions();
  }, [user, items, subtotal, promotionsStore]);

  // Calculate total weight in grams
  const totalWeightGrams = items.reduce((sum, item) => {
    const itemWeight = item.variant
      ? (item.variant.weight_grams || item.product.unit_weight_grams || 0)
      : (item.product.unit_weight_grams || 0);
    return sum + (itemWeight * item.quantity);
  }, 0);

  // Convert to kg for display
  const totalWeightKg = (totalWeightGrams / 1000).toFixed(2);

  // Calculate shipping rates when province or weight changes
  useEffect(() => {
    if (selectedProvince) {
      const calculateRates = async () => {
        setShippingLoading(true);
        const rates = await calculateShippingRates(parseInt(selectedProvince), totalWeightGrams);
        setDynamicCouriers(rates);

        // If the previously selected courier is no longer available, reset selection
        if (selectedCourier && !rates.some(rate => rate.id === selectedCourier.id)) {
          setSelectedCourier(rates[0] || null);
          form.setValue('courier', rates[0]?.id || '');
        } else if (!selectedCourier && rates.length > 0) {
          setSelectedCourier(rates[0]);
          form.setValue('courier', rates[0].id);
        }

        setShippingLoading(false);
      };
      calculateRates();
    }
  }, [selectedProvince, totalWeightGrams]);

  const shippingFee = selectedCourier?.price || 0;

  // Calculate discount amount from either the selected promotion in the UI or from the code input
  let discountAmount = 0;
  let freeShippingApplied = false;
  let selectedPromotionDetails = null;

  // Check if a promotion was selected from the UI
  if (selectedPromotionId) {
    const selectedPromo = availablePromotions.find(promo => promo.id === selectedPromotionId);
    if (selectedPromo) {
      if (selectedPromo.discount_type === 'percentage') {
        discountAmount = subtotal * (selectedPromo.discount_value / 100);
      } else if (selectedPromo.discount_type === 'fixed') {
        discountAmount = Math.min(selectedPromo.discount_value, subtotal); // Don't allow discount to exceed subtotal
      } else if (selectedPromo.discount_type === 'free_shipping') {
        freeShippingApplied = true;
      }
      selectedPromotionDetails = {
        id: selectedPromo.id,
        code: selectedPromo.code,
        description: selectedPromo.description,
        discount_type: selectedPromo.discount_type,
        discount_value: selectedPromo.discount_value,
        free_shipping: selectedPromo.free_shipping || selectedPromo.discount_type === 'free_shipping',
        message: 'Promotion applied successfully!',
        is_valid: true
      };
    }
  }
  // Otherwise, check if a promotion was applied via code input
  else if (appliedPromotion?.is_valid) {
    discountAmount = appliedPromotion.discount_amount || 0;
    freeShippingApplied = appliedPromotion.free_shipping || false;
    selectedPromotionDetails = appliedPromotion;
  }

  // Apply free shipping if applicable
  const finalShippingFee = freeShippingApplied ? 0 : shippingFee;
  const total = subtotal - discountAmount + finalShippingFee;


  // Function to handle selecting a promotion from the UI
  const handleSelectPromotion = (promotion: Promotion) => {
    // Reset the promotion code input if one was entered
    setPromotionCode('');
    form.setValue('promotion_code', '');
    setPromotionError('');
    // Clear any applied promotion from code
    setAppliedPromotion(null);

    // Set the selected promotion
    setSelectedPromotionId(promotion.id);
    toast.success(`${promotion.code} has been applied!`);
  };

  const handleRemovePromotion = () => {
    // Reset both UI selection and code input
    setAppliedPromotion(null);
    setSelectedPromotionId(null);
    setPromotionCode('');
    form.setValue('promotion_code', '');
    setPromotionError('');
    toast.success('Promotion removed');
  };

  const handleApplyPromotion = async () => {
    if (!promotionCode.trim() || !user || subtotal <= 0) return;

    // If a promotion was selected from UI, remove it before applying code
    if (selectedPromotionId) {
      setSelectedPromotionId(null);
    }

    setPromotionLoading(true);
    setPromotionError('');

    try {
      // Extract product IDs from cart items
      const productIds = items.map(item => item.product.id);

      const result = await validatePromotionCode(promotionCode.trim(), user.id, productIds, subtotal);

      if (result && result.is_valid) {
        setAppliedPromotion(result);
        toast.success(result.message || 'Promotion applied successfully!');
        // Update form state with the promotion code
        form.setValue('promotion_code', promotionCode.trim());
      } else {
        setPromotionError(result?.message || 'Invalid promotion code');
        setAppliedPromotion(null);
        form.setValue('promotion_code', '');
        toast.error(result?.message || 'Invalid promotion code');
      }
    } catch (error) {
      console.error('Error applying promotion:', error);
      setPromotionError('Failed to validate promotion code');
      toast.error('Failed to validate promotion code');
    } finally {
      setPromotionLoading(false);
    }
  };

  const onSubmit = async (data: CheckoutForm) => {
    if (!user) {
      toast.error('Please login to continue');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Check stock availability for all items in cart before proceeding
    const supabase = createClient();
    for (const item of items) {
      if (item.variant) {
        // Check variant stock
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', item.variant.id)
          .single();

        if (variantError || !variantData || variantData.stock_quantity < item.quantity) {
          toast.error(`Not enough stock for ${item.product.name} - ${item.variant.variant_name}. Only ${variantData?.stock_quantity || 0} available.`);
          return;
        }
      } else {
        // Check product stock
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product.id)
          .single();

        if (productError || !productData || productData.stock_quantity < item.quantity) {
          toast.error(`Not enough stock for ${item.product.name}. Only ${productData?.stock_quantity || 0} available.`);
          return;
        }
      }
    }

    // Prepare order data for preview
    const orderData = {
      user_id: user.id,
      source: 'marketplace',
      status: 'pending',
      subtotal,
      shipping_fee: finalShippingFee, // Use the potentially reduced shipping fee
      discount_amount: discountAmount, // Use the calculated discount amount
      total_amount: total,
      shipping_courier_name: selectedCourier?.name,
      customer_notes: data.customer_notes || null,
      shipping_address_snapshot: {
        recipient_name: data.recipient_name,
        phone: data.phone,
        address_line1: data.address_line1,
        city: data.city,
        province: data.province,
        postal_code: data.postal_code,
      },
      payment_method: selectedPaymentMethod.name, // Store selected payment method name
      payment_method_description: selectedPaymentMethod.description, // Store payment method details
      items: items.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        product_sku: item.product.sku || '',
        variant_id: item.variant?.id || null,
        variant_name: item.variant?.variant_name || '',
        quantity: item.quantity,
        // For variant products, use variant price_adjustment; for simple products, use base_price
        price_at_purchase: item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price,
      })),
      total_weight_grams: totalWeightGrams,
      selected_promotion: selectedPromotionDetails,
    };

    setPreviewOrderData(orderData);
    setShowInvoicePreview(true);
  };

  const finalizeOrder = async () => {
    if (!user || !previewOrderData) return;

    setLoading(true);
    const supabase = createClient();

    try {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: previewOrderData.user_id,
          source: previewOrderData.source,
          status: previewOrderData.status,
          subtotal: previewOrderData.subtotal,
          shipping_fee: previewOrderData.shipping_fee,
          discount_amount: previewOrderData.discount_amount,
          total_amount: previewOrderData.total_amount,
          shipping_courier_name: previewOrderData.shipping_courier_name,
          customer_notes: previewOrderData.customer_notes,
          shipping_address_snapshot: previewOrderData.shipping_address_snapshot,
          payment_method: previewOrderData.payment_method,
          total_weight_grams: previewOrderData.total_weight_grams,
        })
        .select()
        .single();

      if (orderError) {
        toast.error('Failed to create order');
        setLoading(false);
        return;
      }

      // Create order items
      const orderItems = previewOrderData.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        price_at_purchase: item.price_at_purchase,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        toast.error('Failed to create order items');
        setLoading(false);
        return;
      }

      // If promotion was applied, record usage
      if (previewOrderData.selected_promotion?.is_valid) {
        let promotionId = null;

        // If it's a UI-selected promotion, we already have the ID
        if (selectedPromotionId) {
          promotionId = selectedPromotionId;
        }
        // If it's a code-entered promotion, get the ID by code
        else if (previewOrderData.promotion_code) {
          const { data: promoData } = await supabase
            .from('promotions')
            .select('id')
            .eq('code', previewOrderData.promotion_code.toUpperCase())
            .single();

          if (promoData?.id) {
            promotionId = promoData.id;
          }
        }

        if (promotionId) {
          await supabase
            .from('promotion_usage')
            .insert({
              promotion_id: promotionId,
              user_id: user.id,
              order_id: order.id
            });
        }
      }

      // Update stock - ensure it's done after all items are processed
      for (const item of previewOrderData.items) {
        if (item.variant_id) {
          // For variant products, update the specific variant stock
          // We need to fetch current stock to calculate new value
          const { data: variantData, error: variantError } = await supabase
            .from('product_variants')
            .select('stock_quantity')
            .eq('id', item.variant_id)
            .single();

          if (variantError) {
            console.error('Error fetching variant stock:', variantError);
            toast.error(`Failed to update stock for variant. ${item.variant_name || item.product_name}`);
            setLoading(false);
            // Rollback the order since inventory update failed
            await supabase
              .from('orders')
              .delete()
              .eq('id', order.id);
            await supabase
              .from('order_items')
              .delete()
              .eq('order_id', order.id);
            return;
          }

          if (variantData) {
            const newVariantStock = variantData.stock_quantity - item.quantity;
            const { error: updateError } = await supabase
              .from('product_variants')
              .update({ stock_quantity: newVariantStock })
              .eq('id', item.variant_id);

            if (updateError) {
              console.error('Error updating variant stock:', updateError);
              toast.error(`Failed to update stock for variant. ${item.variant_name || item.product_name}`);
              setLoading(false);
              // Rollback the order since inventory update failed
              await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);
              await supabase
                .from('order_items')
                .delete()
                .eq('order_id', order.id);
              return;
            }
          }
        } else {
          // For simple products, update product stock
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            console.error('Error fetching product stock:', productError);
            toast.error(`Failed to update stock for product. ${item.product_name}`);
            setLoading(false);
            // Rollback the order since inventory update failed
            await supabase
              .from('orders')
              .delete()
              .eq('id', order.id);
            await supabase
              .from('order_items')
              .delete()
              .eq('order_id', order.id);
            return;
          }

          if (productData) {
            const newStock = productData.stock_quantity - item.quantity;
            const { error: updateError } = await supabase
              .from('products')
              .update({ stock_quantity: newStock })
              .eq('id', item.product_id);

            if (updateError) {
              console.error('Error updating product stock:', updateError);
              toast.error(`Failed to update stock for product. ${item.product_name}`);
              setLoading(false);
              // Rollback the order since inventory update failed
              await supabase
                .from('orders')
                .delete()
                .eq('id', order.id);
              await supabase
                .from('order_items')
                .delete()
                .eq('order_id', order.id);
              return;
            }
          }
        }
      }

      // Add points to user (1 point per 10,000 IDR spent, after discount)
      const pointsEarned = Math.floor(previewOrderData.total_amount / 10000);
      if (pointsEarned > 0 && profile) {
        await supabase
          .from('profiles')
          .update({ points_balance: (profile.points_balance || 0) + pointsEarned })
          .eq('id', user.id);
      }

      // Fetch store settings for invoice generation using the store
      const { allSettings } = useStoreSettingsStore.getState();
      const storeSettings = allSettings?.store || {
        storeName: 'ShortTail.id',
        storeDescription: 'Premium Pet Shop - Your one-stop shop for pet supplies',
        storeLogo: '',
        storeEmail: 'support@shorttail.id',
        storePhone: '+6281234567890',
        storeAddress: 'Jl. Pet Lovers No. 123',
        storeCity: 'Jakarta',
        storeProvince: 'DKI Jakarta',
        storePostalCode: '12345',
        storeCurrency: 'IDR',
        storeTimezone: 'Asia/Jakarta',
      };

      // Format order data for invoice (similar to how it's retrieved in the order store)
      const orderForInvoice = {
        id: order.id,
        user_id: order.user_id || undefined, // Convert null to undefined
        user_name: profile?.user_name || '',
        user_email: profile?.user_email || '',
        cashier_id: order.cashier_id || undefined, // Convert null to undefined
        cashier_name: profile?.user_name || '',
        source: order.source,
        status: order.status,
        subtotal: order.subtotal,
        shipping_fee: order.shipping_fee,
        discount_amount: order.discount_amount,
        total_amount: order.total_amount,
        recipient_name: order.shipping_address_snapshot?.recipient_name || profile?.user_name || '',
        recipient_phone: order.shipping_address_snapshot?.phone || profile?.user_phoneno || '',
        recipient_address: order.shipping_address_snapshot?.address_line1 || '',
        recipient_province: order.shipping_address_snapshot?.province || '',
        shipping_courier: order.shipping_courier_name || '',
        shipping_courier_name: order.shipping_courier_name || '',
        shipping_address_snapshot: order.shipping_address_snapshot,
        customer_notes: (order as any).customer_notes || '', // customer_notes might not be in the main Order type but could be returned by select('*')
        payment_method: order.payment_method || 'Not specified', // Include payment method info
        invoice_url: order.invoice_url || undefined, // Convert null to undefined
        packing_list_url: order.packing_list_url || undefined, // Convert null to undefined
        items_count: previewOrderData.items.length,
        items: previewOrderData.items.map((item: any) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku || '',
          variant_id: item.variant_id,
          variant_name: item.variant_name || undefined,
          variant_sku: undefined, // Convert null to undefined
          quantity: item.quantity,
          price_at_purchase: item.price_at_purchase,
        })),
        created_at: order.created_at,
        updated_at: order.updated_at || new Date().toISOString(),
      };

      // Generate invoice
      try {
        const invoiceBlob = await generateInvoiceJPEG(orderForInvoice, storeSettings);
        // Save invoice URL to order
        await supabase
          .from('orders')
          .update({ invoice_url: URL.createObjectURL(invoiceBlob) }) // This would be a temp URL
          .eq('id', order.id);
      } catch (invoiceError) {
        console.error('Error generating invoice:', invoiceError);
        // Continue with order creation even if invoice generation fails
      }

      toast.success(`Order placed successfully! You earned ${pointsEarned} points. Downloading your invoice...`);

      // Clear cart after successful order
      clearCart();

      // Navigate to order details
      router.push(`/dashboard/orders/${order.id}`);
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('An error occurred during checkout');
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <h1 className="text-3xl font-bold text-brown-900 mb-8">Checkout</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Address */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="recipient_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+62812345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="address_line1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Street address, building, unit" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Jakarta" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Province</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Province" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {provinces.map((province) => (
                                <SelectItem key={province.id} value={province.name}>
                                  {province.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Promotions */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Have a Promotion Code?
                  </CardTitle>
                  <CardDescription>
                    Enter your discount code to save on your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="promotion_code"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              placeholder="Enter promotion code"
                              value={promotionCode}
                              onChange={(e) => {
                                setPromotionCode(e.target.value);
                                field.onChange(e.target.value);
                              }}
                              disabled={promotionLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {appliedPromotion ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemovePromotion}
                        disabled={promotionLoading}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={handleApplyPromotion}
                        disabled={promotionLoading || !promotionCode.trim()}
                      >
                        {promotionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Apply'
                        )}
                      </Button>
                    )}
                  </div>
                  {promotionError && (
                    <p className="text-sm text-destructive mt-2">{promotionError}</p>
                  )}
                  {appliedPromotion && appliedPromotion.is_valid && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Promotion applied successfully!
                      </p>
                      <p className="text-sm text-green-700">
                        {appliedPromotion.free_shipping ? 'Free shipping applied' : ''}
                        {appliedPromotion.discount_amount > 0 ? ` Discount: ${formatPrice(appliedPromotion.discount_amount)}` : ''}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shop Promotions */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-primary" />
                    Shop Promotions
                  </CardTitle>
                  <CardDescription>
                    Choose from available promotions for your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {promotionsLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-brown-600">Loading promotions...</span>
                    </div>
                  ) : availablePromotions.length === 0 ? (
                    <div className="text-center py-4 text-brown-500">
                      No promotions available for your cart at this time.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availablePromotions.map((promotion) => (
                        <div
                          key={promotion.id}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedPromotionId === promotion.id
                              ? 'border-primary bg-primary/5'
                              : 'border-brown-200 hover:border-brown-300'
                          }`}
                          onClick={() => handleSelectPromotion(promotion)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-4 w-4 rounded-full border-2 ${
                                selectedPromotionId === promotion.id
                                  ? 'border-primary bg-primary'
                                  : 'border-brown-300'
                              }`}
                            >
                              {selectedPromotionId === promotion.id && (
                                <div className="h-full w-full flex items-center justify-center">
                                  <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-brown-900">{promotion.code}</p>
                              <p className="text-sm text-brown-500">{promotion.description || 'No description'}</p>
                              <div className="flex gap-2 mt-1">
                                {promotion.discount_type === 'percentage' && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {promotion.discount_value}% OFF
                                  </span>
                                )}
                                {promotion.discount_type === 'fixed' && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {formatPrice(promotion.discount_value)} OFF
                                  </span>
                                )}
                                {(promotion.discount_type === 'free_shipping' || promotion.free_shipping) && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    FREE SHIPPING
                                  </span>
                                )}
                                {promotion.discount_type === 'buy_x_get_y' && (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                    BUY {promotion.buy_quantity} GET {promotion.get_quantity} FREE
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-brown-500">
                              {promotion.min_purchase_amount ? `Min. ${formatPrice(promotion.min_purchase_amount)}` : 'No min.'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedPromotionId && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium text-green-800">✓ Promotion applied successfully!</p>
                          <p className="text-sm text-green-700">
                            {availablePromotions.find(p => p.id === selectedPromotionId)?.description || 'Selected promotion applied'}
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={handleRemovePromotion}
                          className="text-green-600 h-auto p-1"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Notes */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Special Requests
                  </CardTitle>
                  <CardDescription>
                    Add any special requests or notes for your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="customer_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Please deliver after 5 PM, gift wrap requested, etc."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Shipping Method */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5 text-primary" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="courier"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="space-y-3">
                            {shippingLoading ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="ml-2 text-sm text-brown-600">Calculating shipping rates...</span>
                              </div>
                            ) : (
                              dynamicCouriers.map((courier) => (
                                <label
                                  key={courier.id}
                                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                                    field.value === courier.id
                                      ? 'border-primary bg-primary/5'
                                      : 'border-brown-200 hover:border-brown-300'
                                  }`}
                                  onClick={() => {
                                    field.onChange(courier.id);
                                    setSelectedCourier(courier);
                                  }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`h-4 w-4 rounded-full border-2 ${
                                        field.value === courier.id
                                          ? 'border-primary bg-primary'
                                          : 'border-brown-300'
                                      }`}
                                    >
                                      {field.value === courier.id && (
                                        <div className="h-full w-full flex items-center justify-center">
                                          <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="font-medium text-brown-900">{courier.name}</p>
                                      <p className="text-sm text-brown-500">{courier.eta}</p>
                                    </div>
                                  </div>
                                  <p className="font-bold text-primary">
                                    {formatPrice(courier.price)}
                                  </p>
                                </label>
                              ))
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Payment Methods */}
              <Card className="border-brown-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Methods
                  </CardTitle>
                  <CardDescription>
                    Select your preferred payment method
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availablePaymentMethods.length === 0 ? (
                    <div className="text-center py-8">
                      <PawPrint className="h-12 w-12 text-brown-300 mx-auto mb-3" />
                      <p className="text-brown-600">No payment methods available</p>
                      <p className="text-sm text-brown-500 mt-1">Contact admin to enable payment methods</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availablePaymentMethods.map((method) => (
                        <label
                          key={method.id}
                          className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                            selectedPaymentMethod?.id === method.id
                              ? 'border-primary bg-primary/5'
                              : 'border-brown-200 hover:border-brown-300'
                          }`}
                          onClick={() => setSelectedPaymentMethod(method)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-4 w-4 rounded-full border-2 ${
                                selectedPaymentMethod?.id === method.id
                                  ? 'border-primary bg-primary'
                                  : 'border-brown-300'
                              }`}
                            >
                              {selectedPaymentMethod?.id === method.id && (
                                <div className="h-full w-full flex items-center justify-center">
                                  <div className="h-1.5 w-1.5 bg-white rounded-full" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-brown-900">{method.name}</p>
                              <p className="text-sm text-brown-500">{method.description}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div>
              <Card className="border-brown-200 sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => {
                      // For variant products, use variant price_adjustment; for simple products, use base_price
                      const price = item.variant ? (item.variant.price_adjustment || 0) : item.product.base_price;
                      return (
                        <div key={`${item.product.id}-${item.variant?.id}`} className="flex gap-3">
                          <div className="h-12 w-12 bg-brown-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            {item.product.main_image_url ? (
                              <img
                                src={item.product.main_image_url}
                                alt={item.product.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <PawPrint className="h-6 w-6 text-brown-300" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-brown-900 line-clamp-1">
                              {item.product.name}
                            </p>
                            {item.variant && (
                              <p className="text-xs text-brown-500">{item.variant.variant_name}</p>
                            )}
                            <p className="text-sm text-brown-600">x{item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium">
                            {formatPrice(price * item.quantity)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <Separator />

                  {/* Estimated Weight */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Estimated Package Weight</p>
                    <p className="text-2xl font-bold text-blue-700">{totalWeightKg} kg</p>
                    <p className="text-xs text-blue-600 mt-1">({totalWeightGrams} grams)</p>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-brown-600">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {selectedPromotionDetails && selectedPromotionDetails.is_valid ? (
                      <>
                        {/* Promotion details box */}
                        <div className="bg-green-50 rounded-lg p-3 mt-2 mb-3 border border-green-200">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-medium text-green-800 flex items-center">
                                <Tag className="h-4 w-4 mr-1" />
                                Promotion Applied
                              </span>
                              <p className="text-xs text-green-700 mt-1">
                                {selectedPromotionDetails.code} - {selectedPromotionDetails.description || 'Discount applied'}
                              </p>
                              {selectedPromotionDetails.discount_type && (
                                <p className="text-xs text-green-600">
                                  {selectedPromotionDetails.discount_type === 'percentage' && `${selectedPromotionDetails.discount_value}% OFF`}
                                  {selectedPromotionDetails.discount_type === 'fixed' && `${formatPrice(selectedPromotionDetails.discount_value)} OFF`}
                                  {selectedPromotionDetails.discount_type === 'buy_x_get_y' && `BUY ${selectedPromotionDetails.buy_quantity} GET ${selectedPromotionDetails.get_quantity} FREE`}
                                  {selectedPromotionDetails.discount_type === 'buy_more_save_more' && 'Progressive discount applied'}
                                  {selectedPromotionDetails.discount_type === 'free_shipping' && 'Free shipping applied'}
                                </p>
                              )}
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={handleRemovePromotion}
                              className="text-green-600 h-auto p-1"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>

                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-brown-600">Discount ({selectedPromotionDetails.code})</span>
                            <span className="text-destructive">-{formatPrice(discountAmount)}</span>
                          </div>
                        )}
                        {freeShippingApplied && (
                          <div className="flex justify-between text-sm">
                            <span className="text-brown-600">Shipping</span>
                            <span className="text-green-600">FREE</span>
                          </div>
                        )}
                        {!freeShippingApplied && (
                          <div className="flex justify-between text-sm">
                            <span className="text-brown-600">Shipping</span>
                            <span>{finalShippingFee ? formatPrice(finalShippingFee) : '-'}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="text-brown-600">Shipping</span>
                        <span>{shippingFee ? formatPrice(shippingFee) : '-'}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Place Order
                  </Button>

                  <p className="text-xs text-center text-brown-500">
                    By placing this order, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>

      {/* Last Chance - Add More Items */}
      {items.length > 0 && (
        <div className="mt-12">
          <RelatedProducts
            productId={items[0].product.id}
            title="Add More to Your Order"
            limit={5}
          />
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showInvoicePreview && previewOrderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Order Confirmation</h2>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowInvoicePreview(false)}
                  disabled={loading}
                >
                  Close
                </Button>
              </div>

              <div className="border rounded-lg p-4 mb-4">
                <h3 className="font-bold text-lg mb-2">Invoice Preview</h3>

                {/* Shipping Address */}
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Shipping Address</h4>
                  <p className="text-sm">{previewOrderData.shipping_address_snapshot.recipient_name}</p>
                  <p className="text-sm">{previewOrderData.shipping_address_snapshot.phone}</p>
                  <p className="text-sm">{previewOrderData.shipping_address_snapshot.address_line1}</p>
                  <p className="text-sm">{previewOrderData.shipping_address_snapshot.city}, {previewOrderData.shipping_address_snapshot.province} {previewOrderData.shipping_address_snapshot.postal_code}</p>
                </div>

                {/* Shipping Courier */}
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Shipping Method</h4>
                  <p className="text-sm">{previewOrderData.shipping_courier_name}</p>
                </div>

                {/* Package Weight */}
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Package Weight</h4>
                  <p className="text-sm">{(previewOrderData.total_weight_grams / 1000).toFixed(2)} kg ({previewOrderData.total_weight_grams} grams)</p>
                </div>

                {/* Order Items */}
                <div className="mb-4">
                  <h4 className="font-medium mb-1">Order Items</h4>
                  <ul className="text-sm">
                    {previewOrderData.items.map((item: any, index: number) => (
                      <li key={index} className="flex justify-between">
                        <span>
                          {item.product_name}
                          {item.variant_name && <span> ({item.variant_name})</span>} - Qty: {item.quantity}
                        </span>
                        <span>{formatPrice(item.price_at_purchase * item.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing Breakdown */}
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span>Subtotal:</span>
                    <span>{formatPrice(previewOrderData.subtotal)}</span>
                  </div>
                  {previewOrderData.discount_amount > 0 && (
                    <div className="flex justify-between mb-1">
                      <span>Discount:</span>
                      <span className="text-destructive">-{formatPrice(previewOrderData.discount_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between mb-1">
                    <span>Shipping:</span>
                    <span>{formatPrice(previewOrderData.shipping_fee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-primary">{formatPrice(previewOrderData.total_amount)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h4 className="font-medium mb-1">Payment Method</h4>
                  <p className="text-sm font-medium">{previewOrderData.payment_method}</p>
                  <p className="text-sm text-brown-600">{previewOrderData.payment_method_description}</p>
                </div>
              </div>

              {/* QRIS Payment Information - Only show when QRIS is selected */}
              {previewOrderData?.payment_method?.toLowerCase().includes('qris') && storePaymentSettings?.qris_image && (
                <div className="mb-6 p-4 border-2 border-green-300 rounded-lg bg-green-50">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="h-6 w-6 text-green-600" />
                    <h3 className="font-bold text-lg text-green-800">QRIS Payment Information</h3>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-white border border-green-200 rounded-lg mb-4">
                      <img
                        src={storePaymentSettings.qris_image}
                        alt="QRIS Code"
                        className="w-40 h-40 object-contain mx-auto"
                      />
                    </div>
                    <div className="w-full max-w-xs text-center mb-3">
                      <p className="text-lg font-bold text-green-700 mb-1">Amount to Pay: {formatPrice(previewOrderData.total_amount)}</p>
                    </div>
                    <div className="w-full space-y-2">
                      {storePaymentSettings.qris_name && (
                        <div className="text-center p-2 bg-white rounded border">
                          <p className="font-medium text-brown-700">Merchant Name:</p>
                          <p className="text-brown-900">{storePaymentSettings.qris_name}</p>
                        </div>
                      )}
                      {storePaymentSettings.qris_nmid && (
                        <div className="text-center p-2 bg-white rounded border">
                          <p className="font-medium text-brown-700">NMID:</p>
                          <p className="text-brown-900">{storePaymentSettings.qris_nmid}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Alert message */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-center text-yellow-700 font-medium">
                  Please make the payment according to the chosen payment method and screenshot the payment proof/transfer receipt.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInvoicePreview(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Back to Edit
                </Button>
                <Button
                  type="button"
                  onClick={finalizeOrder}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm & Pay'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
