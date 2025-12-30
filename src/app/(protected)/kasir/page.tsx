'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Search, Plus, Minus, Trash2, PawPrint, CreditCard, Banknote, Loader2, Package, Tag, ShoppingCart, Building2, Smartphone, QrCode, Wallet, ChevronUp, ChevronDown, X, Menu } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useCategories, type Category } from '@/hooks/use-categories';
import { useAllSettings } from '@/hooks/use-store-settings';
import type { Product, ProductVariant } from '@/types/database';

interface CartItem {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
  displayName: string;
  price: number;
  availableStock: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
}

interface ProductWithVariants extends Product {
  variants?: ProductVariant[];
}

interface Promotion {
  id: string;
  code: string;
  description?: string;
  discount_type: string;
  discount_value: number;
  min_purchase_amount?: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
  free_shipping?: boolean;
  buy_quantity?: number;
  get_quantity?: number;
  max_uses_per_user?: number;
  applies_to?: string;
  product_ids?: string[];
}

export default function KasirPOSPage() {
  const { user, profile } = useAuth();
  const { categories: dbCategories, loading: categoriesLoading, getActiveCategories } = useCategories();
  const { settings: storeSettings } = useAllSettings();
  const activeCategories = useMemo(() => getActiveCategories(), [getActiveCategories]);
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'ewallet' | 'qris'>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariants | null>(null);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [showCurrentOrder, setShowCurrentOrder] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Recipient and shipping data
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientProvince, setRecipientProvince] = useState('');
  const [shippingCourier, setShippingCourier] = useState('');
  const [customCourier, setCustomCourier] = useState('');
  const [shippingCost, setShippingCost] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'payment'>('details');

  // Profile search
  const [profileSearchQuery, setProfileSearchQuery] = useState('');
  const [searchedProfiles, setSearchedProfiles] = useState<any[]>([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [searchingProfiles, setSearchingProfiles] = useState(false);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);

  // Debounce ref for profile search
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // New states for mobile responsiveness
  const [isOrderPanelOpen, setIsOrderPanelOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  const fetchProducts = useCallback(async () => {
    const supabase = createClient();

    // Fetch products with variants
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      console.error('Error fetching products:', productsError);
      toast.error('Failed to load products');
      setLoading(false);
      return;
    }

    // Fetch ALL variants for products that have them (including zero stock)
    const productsWithVariants = productsData?.filter((p: Product) => p.has_variants).map((p: Product) => p.id) || [];

    if (productsWithVariants.length > 0) {
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .in('product_id', productsWithVariants)
        .order('variant_name');

      // Attach variants to products
      const enrichedProducts = productsData?.map((product: Product) => ({
        ...product,
        variants: product.has_variants
          ? variantsData?.filter((v: ProductVariant) => v.product_id === product.id) || []
          : []
      })) || [];

      setProducts(enrichedProducts);
    } else {
      setProducts(productsData?.map((p: Product) => ({ ...p, variants: [] })) || []);
    }

    setLoading(false);
  }, []);

  const fetchPromotions = useCallback(async () => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { data } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .eq('available_for_pos', true)
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`);

    if (data) {
      setAvailablePromotions(data);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchPromotions();
    fetchProvinces();
    fetchCouriers();
    
    // Check if we're on mobile view
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 1024); // lg breakpoint
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [fetchProducts, fetchPromotions]);

  // Listen for toggle current order panel event
  useEffect(() => {
    const handleToggle = () => {
      setShowCurrentOrder(prev => !prev);
    };

    window.addEventListener('toggleCurrentOrder', handleToggle);
    return () => window.removeEventListener('toggleCurrentOrder', handleToggle);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const fetchProvinces = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('provinces')
      .select('*')
      .eq('is_active', true)
      .order('province_name');
    if (data) setProvinces(data);
  };

  const fetchCouriers = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('shipping_couriers')
      .select('*')
      .eq('is_active', true)
      .order('courier_name');
    if (data) setCouriers(data);
  };

  // Search profiles with debouncing
  const searchProfiles = useCallback((query: string) => {
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!query || query.length < 2) {
      setSearchedProfiles([]);
      setShowProfileDropdown(false);
      setSearchingProfiles(false);
      return;
    }

    setSearchingProfiles(true);

    // Debounce the actual search by 300ms
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const supabase = createClient();

        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_name, user_phoneno, user_email, recipient_name, recipient_phoneno, recipient_address_line1, recipient_province_id, address_line1, province_id')
          .or(`user_name.ilike.%${query}%,user_phoneno.ilike.%${query}%`)
          .limit(10);

        if (error) {
          console.error('Profile search error:', error);
          setSearchingProfiles(false);
          return;
        }

        if (data && data.length > 0) {
          setSearchedProfiles(data);
          setShowProfileDropdown(true);
        } else {
          setSearchedProfiles([]);
          setShowProfileDropdown(false);
        }

        setSearchingProfiles(false);
      } catch (err) {
        console.error('Exception searching profiles:', err);
        setSearchingProfiles(false);
      }
    }, 300);
  }, []);

  // Auto-fill recipient data from selected profile
  const selectProfile = (profile: any) => {
    setRecipientName(profile.recipient_name || profile.user_name || '');
    setRecipientPhone(profile.user_phoneno || '');
    setRecipientAddress(profile.recipient_address_line1 || profile.address_line1 || '');

    // Directly use province_id from profile (no matching needed)
    if (profile.recipient_province_id) {
      setRecipientProvince(profile.recipient_province_id.toString());
      console.log('Auto-filled province ID:', profile.recipient_province_id);
    } else {
      console.warn('Profile has no recipient_province_id');
    }

    setProfileSearchQuery(profile.user_name || profile.user_phoneno);
    setShowProfileDropdown(false);
  };

  const handleProductClick = (product: ProductWithVariants) => {
    // If product has variants flag set, always show variant dialog
    // This handles products that have variants in the database even if some have 0 stock
    if (product.has_variants) {
      setSelectedProduct(product);
      setVariantDialogOpen(true);
    } else {
      // No variants - add base product directly
      addToCart(product, null);
    }
  };

  const addToCart = (product: ProductWithVariants, variant: ProductVariant | null) => {
    const price = variant ? product.base_price + variant.price_adjustment : product.base_price;
    const availableStock = variant ? variant.stock_quantity : product.stock_quantity;
    const displayName = variant ? `${product.name} - ${variant.variant_name}` : product.name;
    const cartKey = variant ? `${product.id}-${variant.id}` : product.id;

    if (availableStock <= 0) {
      toast.error('Out of stock');
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) =>
        item.product.id === product.id &&
        (variant ? item.variant?.id === variant.id : !item.variant)
      );

      if (existing) {
        if (existing.quantity >= availableStock) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map((item) =>
          (item.product.id === product.id &&
           (variant ? item.variant?.id === variant.id : !item.variant))
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, {
        product,
        variant,
        quantity: 1,
        displayName,
        price,
        availableStock
      }];
    });

    setVariantDialogOpen(false);
    
    // On mobile, close the order panel to focus on products
    if (isMobileView) {
      setIsOrderPanelOpen(false);
    }
  };

  const updateQuantity = (productId: string, variantId: string | null, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId &&
              (variantId ? item.variant?.id === variantId : !item.variant)) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.availableStock) {
              toast.error('Not enough stock');
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string, variantId: string | null) => {
    setCart((prev) => prev.filter((item) =>
      !(item.product.id === productId &&
        (variantId ? item.variant?.id === variantId : !item.variant))
    ));
  };

  const clearCart = () => {
    setCart([]);
    setAppliedPromotion(null);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Calculate total weight in grams
  const totalWeightGrams = cart.reduce((sum, item) => {
    const itemWeight = item.variant
      ? (item.variant.weight_grams || item.product.unit_weight_grams || 0)
      : (item.product.unit_weight_grams || 0);
    return sum + (itemWeight * item.quantity);
  }, 0);

  // Convert to kg for display
  const totalWeightKg = (totalWeightGrams / 1000).toFixed(2);

  // Calculate shipping cost when courier, province, or weight changes
  useEffect(() => {
    const calculateShipping = async () => {
      // Reset shipping cost if conditions not met
      if (!shippingCourier || shippingCourier === 'custom' || shippingCourier === 'pickup') {
        setShippingCost('0');
        return;
      }

      if (!recipientProvince) {
        setShippingCost('');
        return;
      }

      try {
        const supabase = createClient();
        const courierId = parseInt(shippingCourier);
        const provinceId = parseInt(recipientProvince);

        console.log('=== SHIPPING CALCULATION ===');
        console.log('Courier ID:', courierId, 'Type:', typeof courierId);
        console.log('Province ID:', provinceId, 'Type:', typeof provinceId);
        console.log('Total Weight (grams):', totalWeightGrams);
        console.log('Total Weight (kg):', totalWeightKg);

        // First check if courier is active
        const { data: courierData } = await supabase
          .from('shipping_couriers')
          .select('id, courier_name, is_active')
          .eq('id', courierId)
          .single();

        console.log('Courier data:', courierData);

        if (!courierData) {
          console.error('Courier not found in database');
          toast.error('Selected courier not found');
          setShippingCost('');
          return;
        }

        if (!courierData.is_active) {
          console.warn('Courier is not active');
          toast.warning('Selected courier is not active');
          setShippingCost('');
          return;
        }

        const { data, error } = await supabase
          .from('shipping_rates')
          .select('cost, estimated_days')
          .eq('courier_id', courierId)
          .eq('province_id', provinceId)
          .maybeSingle();

        console.log('Shipping rate query result:', data);
        console.log('Shipping rate query error:', error);

        // Debug: Try to fetch all rates for this courier to see what's available
        const { data: allRates } = await supabase
          .from('shipping_rates')
          .select('province_id, cost')
          .eq('courier_id', courierId);

        console.log('All rates for this courier:', allRates);

        // Debug: Check if RLS is the issue by checking shipping_couriers join
        const { data: rateWithJoin } = await supabase
          .from('shipping_rates')
          .select(`
            cost,
            estimated_days,
            shipping_couriers!inner (
              id,
              courier_name,
              is_active
            )
          `)
          .eq('courier_id', courierId)
          .eq('province_id', provinceId)
          .maybeSingle();

        console.log('Rate with courier join:', rateWithJoin);

        if (error) {
          console.error('Shipping rate query error:', error);
          toast.error('Error fetching shipping rate. Please enter manually.');
          setShippingCost('');
          return;
        }

        if (!data) {
          console.warn('No shipping rate found for courier:', courierId, 'province:', provinceId);
          toast.warning('No shipping rate configured for this courier and province. Please enter manually.');
          setShippingCost('');
          return;
        }

        // If weight < 1kg, use the base rate from shipping_rates
        // If weight >= 1kg, calculate per-kg rate
        const baseRate = parseFloat(data.cost.toString());

        if (totalWeightGrams < 1000) {
          // Under 1kg: use base rate
          setShippingCost(baseRate.toString());
          console.log('✓ Shipping cost (base rate):', baseRate);
          toast.success(`Shipping cost auto-calculated: Rp ${baseRate.toLocaleString()}`);
        } else {
          // 1kg or more: calculate based on weight
          const weightInKg = Math.ceil(totalWeightGrams / 1000);
          const totalCost = baseRate * weightInKg;
          setShippingCost(totalCost.toString());
          console.log(`✓ Shipping cost (${weightInKg}kg x ${baseRate}):`, totalCost);
          toast.success(`Shipping cost auto-calculated: Rp ${totalCost.toLocaleString()} (${weightInKg}kg)`);
        }

        console.log('=== CALCULATION COMPLETE ===');
      } catch (err) {
        console.error('Error calculating shipping:', err);
        setShippingCost('');
        toast.error('Error calculating shipping cost');
      }
    };

    calculateShipping();
  }, [shippingCourier, recipientProvince, totalWeightGrams]);

  // Automatically find and apply the best promotion
  useEffect(() => {
    if (cart.length === 0) {
      setAppliedPromotion(null);
      return;
    }

    const findBestPromotion = () => {
      const now = new Date();
      const cartProductIds = cart.map(item => item.product.id);
      const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

      let bestPromotion: Promotion | null = null;
      let maxDiscount = 0;

      for (const promo of availablePromotions) {
        // Check date validity
        if (promo.start_date && new Date(promo.start_date) > now) continue;
        if (promo.end_date && new Date(promo.end_date) < now) continue;

        // Check minimum purchase
        if (promo.min_purchase_amount && subtotal < promo.min_purchase_amount) continue;

        // Check product applicability
        if (promo.applies_to === 'specific_products' && promo.product_ids) {
          const hasApplicableProduct = cartProductIds.some(id => promo.product_ids!.includes(id));
          if (!hasApplicableProduct) continue;
        }

        // Calculate potential discount
        let discount = 0;

        if (promo.discount_type === 'percentage') {
          const applicableAmount = promo.applies_to === 'specific_products' && promo.product_ids
            ? cart.filter(item => promo.product_ids!.includes(item.product.id))
                .reduce((sum, item) => sum + item.price * item.quantity, 0)
            : subtotal;
          discount = applicableAmount * (promo.discount_value / 100);
        } else if (promo.discount_type === 'fixed') {
          discount = promo.discount_value;
        } else if (promo.discount_type === 'buy_x_get_y') {
          const sets = Math.floor(totalQuantity / (promo.buy_quantity || 1));
          if (sets > 0) {
            const sortedPrices = cart.flatMap(item =>
              Array(item.quantity).fill(item.price)
            ).sort((a, b) => a - b);
            const freeItems = sets * (promo.get_quantity || 1);
            discount = sortedPrices.slice(0, Math.min(freeItems, sortedPrices.length))
              .reduce((sum, price) => sum + price, 0);
          }
        }

        if (discount > maxDiscount) {
          maxDiscount = discount;
          bestPromotion = promo;
        }
      }

      setAppliedPromotion(bestPromotion);
    };

    findBestPromotion();
  }, [cart, availablePromotions, subtotal]);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Enter a promo code');
      return;
    }

    setValidatingPromo(true);
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .eq('available_for_pos', true)
        .single();

      if (error || !data) {
        toast.error('Invalid or inactive promo code');
        setValidatingPromo(false);
        return;
      }

      // Check validity period
      const now = new Date();
      if (data.start_date && new Date(data.start_date) > now) {
        toast.error('Promotion not yet started');
        setValidatingPromo(false);
        return;
      }
      if (data.end_date && new Date(data.end_date) < now) {
        toast.error('Promotion has expired');
        setValidatingPromo(false);
        return;
      }

      // Check minimum purchase
      if (data.min_purchase_amount && subtotal < data.min_purchase_amount) {
        toast.error(`Minimum purchase of ${formatPrice(data.min_purchase_amount)} required`);
        setValidatingPromo(false);
        return;
      }

      // Check if applies to products in cart
      if (data.applies_to === 'specific_products' && data.product_ids) {
        const cartProductIds = cart.map(item => item.product.id);
        const hasApplicableProduct = cartProductIds.some(id => data.product_ids!.includes(id));
        if (!hasApplicableProduct) {
          toast.error('Promotion does not apply to items in cart');
          setValidatingPromo(false);
          return;
        }
      }

      setAppliedPromotion(data);
      toast.success(`Promo "${data.code}" applied successfully!`);
    } catch (err) {
      console.error('Error applying promo:', err);
      toast.error('Failed to apply promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const removePromoCode = () => {
    setAppliedPromotion(null);
    setPromoCode('');
    toast.info('Promo code removed');
  };

  const calculateDiscount = () => {
    if (!appliedPromotion) return 0;

    const promo = appliedPromotion;
    let discount = 0;

    // Calculate based on discount type
    if (promo.discount_type === 'percentage') {
      discount = subtotal * (promo.discount_value / 100);
    } else if (promo.discount_type === 'fixed') {
      discount = promo.discount_value;
    } else if (promo.discount_type === 'buy_x_get_y') {
      // Simple implementation: for every buy_quantity, give get_quantity discount
      const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
      const sets = Math.floor(totalItems / (promo.buy_quantity || 1));
      if (sets > 0) {
        // Give discount on cheapest items
        const sortedPrices = cart.flatMap(item =>
          Array(item.quantity).fill(item.price)
        ).sort((a, b) => a - b);
        const freeItems = sets * (promo.get_quantity || 1);
        discount = sortedPrices.slice(0, Math.min(freeItems, sortedPrices.length)).reduce((sum, price) => sum + price, 0);
      }
    }
    // buy_more_save_more would need tier lookup from database

    // If applies to specific products, only discount those
    if (promo.applies_to === 'specific_products' && promo.product_ids) {
      const applicableSubtotal = cart
        .filter(item => promo.product_ids!.includes(item.product.id))
        .reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (promo.discount_type === 'percentage') {
        discount = applicableSubtotal * (promo.discount_value / 100);
      } else if (promo.discount_type === 'fixed') {
        discount = Math.min(promo.discount_value, applicableSubtotal);
      }
    }

    return Math.min(discount, subtotal); // Discount cannot exceed subtotal
  };

  const discountAmount = calculateDiscount();
  const shippingCostAmount = parseFloat(shippingCost) || 0;
  const total = subtotal - discountAmount + shippingCostAmount;

  const processCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Check stock availability for all items in cart before proceeding
    const supabase = createClient();
    for (const item of cart) {
      if (item.variant) {
        // Check variant stock
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', item.variant.id)
          .single();

        if (variantError || !variantData || variantData.stock_quantity < item.quantity) {
          toast.error(`Not enough stock for ${item.product.name} - ${item.variant.variant_name || 'Variant'}. Only ${variantData?.stock_quantity || 0} available.`);
          setProcessing(false);
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
          setProcessing(false);
          return;
        }
      }
    }

    setProcessing(true);

    // Get selected courier name
    let courierName = '';
    if (shippingCourier === 'pickup') {
      courierName = 'Customer Pickup';
    } else if (shippingCourier === 'custom') {
      courierName = customCourier;
    } else {
      const selectedCourier = couriers.find(c => c.id.toString() === shippingCourier);
      courierName = selectedCourier?.courier_name || '';
    }

    // Get selected province name
    const selectedProvince = provinces.find(p => p.id.toString() === recipientProvince);
    const provinceName = selectedProvince?.province_name || '';

    // Create order with shipping details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: null, // Walk-in customer
        user_name: null, // Walk-in customer has no user name
        cashier_id: user?.id,
        cashier_name: profile?.user_name, // Store cashier's name
        source: 'pos',
        status: 'paid',
        subtotal,
        shipping_fee: shippingCostAmount,
        discount_amount: discountAmount,
        total_amount: total,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        recipient_address: recipientAddress,
        recipient_province: provinceName,
        recipient_province_id: recipientProvince ? parseInt(recipientProvince) : null,
        shipping_courier: courierName,
        shipping_weight_grams: totalWeightGrams,
        payment_method: paymentMethod,
        customer_notes: customerNotes || null,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      toast.error('Failed to create order');
      setProcessing(false);
      return;
    }

    // Create order items
    const orderItems = cart.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      variant_id: item.variant?.id || null,
      quantity: item.quantity,
      price_at_purchase: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      toast.error('Failed to create order items');
      setProcessing(false);
      return;
    }

    // Update stock
    for (const item of cart) {
      if (item.variant) {
        // Update variant stock - fetch current stock first to ensure accuracy
        const { data: variantData, error: variantError } = await supabase
          .from('product_variants')
          .select('stock_quantity')
          .eq('id', item.variant.id)
          .single();

        if (variantError) {
          console.error('Error fetching variant stock:', variantError);
          toast.error(`Failed to update stock for variant: ${item.displayName || 'Unknown'}`);
          setProcessing(false);
          return; // Stop processing if stock update fails
        }

        if (variantData) {
          const newVariantStock = variantData.stock_quantity - item.quantity;
          const { error: updateError } = await supabase
            .from('product_variants')
            .update({ stock_quantity: newVariantStock })
            .eq('id', item.variant.id);

          if (updateError) {
            console.error('Error updating variant stock:', updateError);
            toast.error(`Failed to update stock for variant: ${item.displayName || 'Unknown'}`);
            setProcessing(false);
            return; // Stop processing if stock update fails
          }
        }
      } else {
        // Update product stock - fetch current stock first to ensure accuracy
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product.id)
          .single();

        if (productError) {
          console.error('Error fetching product stock:', productError);
          toast.error(`Failed to update stock for product: ${item.displayName || 'Unknown'}`);
          setProcessing(false);
          return; // Stop processing if stock update fails
        }

        if (productData) {
          const newStock = productData.stock_quantity - item.quantity;
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product.id);

          if (updateError) {
            console.error('Error updating product stock:', updateError);
            toast.error(`Failed to update stock for product: ${item.displayName || 'Unknown'}`);
            setProcessing(false);
            return; // Stop processing if stock update fails
          }
        }
      }
    }

    // Notification will be handled by database triggers

    toast.success(`Order #${order.id.slice(0, 8)} completed!`);

    // Reset all form data
    setCart([]);
    setAppliedPromotion(null);
    setCheckoutOpen(false);
    setCheckoutStep('details');
    setCashReceived('');
    setPaymentMethod('cash');

    // Reset shipping details
    setRecipientName('');
    setRecipientPhone('');
    setRecipientAddress('');
    setRecipientProvince('');
    setShippingCourier('');
    setCustomCourier('');
    setShippingCost('');
    setProfileSearchQuery('');
    setSearchedProfiles([]);

    fetchProducts(); // Refresh stock
    setProcessing(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Handle category filtering - 'all' shows everything, specific category only shows products in that category
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;

      // Show ALL products regardless of stock (we'll show out of stock status instead)
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Helper function to check if product is out of stock
  const isProductOutOfStock = (product: ProductWithVariants) => {
    if (product.has_variants) {
      // For variant products: check if ALL variants AND base stock are <= 0
      const hasVariantStock = product.variants && product.variants.some(v => v.stock_quantity > 0);
      const hasBaseStock = product.stock_quantity > 0;
      return !hasVariantStock && !hasBaseStock;
    }
    // For non-variant products: check base stock only
    return product.stock_quantity <= 0;
  };

  const cashAmount = parseFloat(cashReceived) || 0;
  const change = cashAmount - total;


  // On mobile, when order panel is open, show a compact version instead of full panel
  const renderOrderPanel = () => {
    if (isMobileView) {
      if (!isOrderPanelOpen) {
        // Show compact order summary as floating button
        return (
          <div className="fixed bottom-24 right-4 z-50">
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 w-14 p-0 flex items-center justify-center"
              onClick={() => setIsOrderPanelOpen(true)}
            >
              <ShoppingCart className="h-6 w-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        );
      } else {
        // Full order panel overlay
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex flex-col">
            <div className="bg-white rounded-t-2xl flex flex-col flex-1 max-h-[70vh] shadow-xl">
              {/* Mobile header with toggle */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Current Order</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOrderPanelOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Order content */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                    <h4 className="font-medium text-gray-700">Cart is empty</h4>
                    <p className="text-sm mt-1">Add items to start your order</p>
                  </div>
                ) : (
                  <>
                    {/* Cart Items */}
                    <div className="space-y-3 mb-6">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.product.id}-${item.variant?.id || 'base'}-${index}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          {/* Product Image */}
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                            {item.product.main_image_url ? (
                              <img
                                src={item.product.main_image_url}
                                alt={item.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <PawPrint className="h-6 w-6 text-gray-400" />
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm line-clamp-1">
                              {item.displayName}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <p className="text-sm font-bold text-primary">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <span className="text-xs text-gray-500">
                                  ({formatPrice(item.price)} x {item.quantity})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product.id, item.variant?.id || null, -1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 rounded-full"
                              onClick={() => updateQuantity(item.product.id, item.variant?.id || null, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeFromCart(item.product.id, item.variant?.id || null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                      {/* Promo Applied */}
                      {appliedPromotion && discountAmount > 0 && (
                        <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200 mb-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">{appliedPromotion.code}</span>
                          </div>
                          <span className="text-sm font-bold text-green-600">-{formatPrice(discountAmount)}</span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                          <span className="font-medium">{formatPrice(subtotal)}</span>
                        </div>
                        {discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span className="font-medium">-{formatPrice(discountAmount)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm font-bold text-gray-900">Total</span>
                          </div>
                          <span className="text-lg font-bold text-primary">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Checkout button */}
              <div className="p-4 border-t">
                <Button
                  className="w-full h-12 text-base font-semibold shadow-lg"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setIsOrderPanelOpen(false);
                    setCheckoutOpen(true);
                  }}
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Checkout ({formatPrice(total)})
                </Button>
              </div>
            </div>
          </div>
        );
      }
    } else {
      // Desktop view - side panel
      return (
        <div className={`flex flex-col h-full w-full max-w-xs lg:max-w-md ${isOrderPanelOpen ? 'block' : 'hidden lg:block'}`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Current Order</h3>
                <p className="text-sm text-gray-600">
                  {cart.length === 0 ? 'No items' : `${cart.reduce((sum, item) => sum + item.quantity, 0)} items`}
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCart}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Cart Items - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full">
                <ShoppingCart className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <h4 className="font-medium text-gray-700">Cart is empty</h4>
                <p className="text-sm mt-1">Add items to start your order</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div
                    key={`${item.product.id}-${item.variant?.id || 'base'}-${index}`}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Product Image */}
                    <div className="w-12 h-12 bg-gray-50 rounded-md flex items-center justify-center overflow-hidden">
                      {item.product.main_image_url ? (
                        <img
                          src={item.product.main_image_url}
                          alt={item.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PawPrint className="h-6 w-6 text-gray-400" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm line-clamp-1">
                        {item.displayName}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-sm font-bold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <span className="text-xs text-gray-500">
                            ({formatPrice(item.price)} x {item.quantity})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.product.id, item.variant?.id || null, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => updateQuantity(item.product.id, item.variant?.id || null, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeFromCart(item.product.id, item.variant?.id || null)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer - Order Summary & Checkout */}
          <div className="border-t border-gray-200 bg-white p-4 space-y-3">
            {/* Promo Applied */}
            {appliedPromotion && discountAmount > 0 && (
              <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">{appliedPromotion.code}</span>
                </div>
                <span className="text-sm font-bold text-green-600">-{formatPrice(discountAmount)}</span>
              </div>
            )}

            {/* Summary */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal ({cart.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-base font-bold text-gray-900">Total</span>
                </div>
                <span className="text-xl font-bold text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Checkout Button */}
            <Button
              className="w-full h-12 text-base font-semibold shadow-lg"
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              <CreditCard className="h-5 w-5 mr-2" />
              Checkout ({formatPrice(total)})
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:flex-row lg:h-[calc(100vh-6rem)] bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden p-4 bg-white border-b flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">POS System</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOrderPanelOpen && isMobileView ? 'hidden' : 'flex'} ${isOrderPanelOpen && !isMobileView ? 'lg:w-2/3' : 'w-full'}`}>
          {/* Search & Filters */}
          <div className="p-4 bg-white border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="p-4 bg-white border-b">
            <ScrollArea className="w-full" orientation="horizontal">
              <div className="flex gap-2 pb-1.5 min-w-max">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                  className="whitespace-nowrap text-base h-10 px-4"
                >
                  All Products
                </Button>
                {categoriesLoading ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-32 bg-gray-100 rounded-md animate-pulse"
                      />
                    ))}
                  </>
                ) : (
                  activeCategories.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                      className="whitespace-nowrap text-base h-10 px-4"
                    >
                      {cat.name}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <PawPrint className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-gray-600">No products found</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredProducts.map((product) => {
                  // Calculate total stock: variant stock + base stock for variant products
                  const variantStock = product.variants?.reduce((sum, v) => sum + v.stock_quantity, 0) || 0;
                  const totalStock = product.has_variants
                    ? variantStock + product.stock_quantity  // Include base stock for variant products
                    : product.stock_quantity;
                  const outOfStock = isProductOutOfStock(product);

                  return (
                    <button
                      key={product.id}
                      onClick={() => {
                        if (outOfStock) {
                          toast.error('Out of Stock, please contact admin');
                          return;
                        }
                        handleProductClick(product);
                      }}
                      className={`bg-white border rounded-xl p-4 text-left transition-all group relative ${
                        outOfStock
                          ? 'border-red-200 opacity-75 cursor-not-allowed'
                          : 'border-gray-200 hover:shadow-lg hover:border-primary'
                      }`}
                    >
                      {/* Out of Stock Overlay */}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-gray-900/40 rounded-xl flex items-center justify-center z-10">
                          <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded transform -rotate-12">
                            OUT OF STOCK
                          </div>
                        </div>
                      )}
                      <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                        {product.main_image_url ? (
                          <img
                            src={product.main_image_url}
                            alt={product.name}
                            className={`w-full h-full object-cover ${outOfStock ? 'grayscale' : ''}`}
                          />
                        ) : (
                          <PawPrint className="h-8 w-8 text-gray-300" />
                        )}
                        {product.has_variants && product.variants && product.variants.length > 0 && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                            <Package className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <h3 className={`font-medium text-sm line-clamp-2 mb-2 transition-colors ${
                        outOfStock ? 'text-gray-500' : 'text-gray-900 group-hover:text-primary'
                      }`}>
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-2">
                        {product.has_variants && product.variants && product.variants.length > 0 ? (
                          <>
                            <p className={`font-bold text-base ${outOfStock ? 'text-gray-400' : 'text-primary'}`}>
                              {formatPrice(product.base_price)}
                            </p>
                            <span className="text-sm text-gray-500">+ var</span>
                          </>
                        ) : (
                          <p className={`font-bold text-base ${outOfStock ? 'text-gray-400' : 'text-primary'}`}>
                            {formatPrice(product.base_price)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <Badge
                          variant={outOfStock ? "destructive" : "secondary"}
                          className="text-xs px-2 py-1"
                        >
                          {outOfStock ? 'No Stock' : `Stock: ${totalStock}`}
                        </Badge>
                        {product.has_variants && product.variants && product.variants.length > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-1">
                            {product.variants.length} var
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Panel - Desktop sidebar or mobile overlay */}
        {renderOrderPanel()}
      </div>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={(open) => {
        setCheckoutOpen(open);
        if (!open) {
          // Reset to first step when closing
          setCheckoutStep('details');
        }
      }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {checkoutStep === 'details' ? 'Recipient & Shipping Details' : 'Complete Payment'}
            </DialogTitle>
            <DialogDescription>
              {checkoutStep === 'details'
                ? 'Enter recipient and shipping courier information'
                : `Total amount: ${formatPrice(total)}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {checkoutStep === 'details' ? (
              <>
                {/* Profile Search */}
                <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <label className="text-sm font-medium text-blue-900">Search Customer Profile (Optional)</label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search by name or phone number..."
                      value={profileSearchQuery}
                      onChange={(e) => {
                        setProfileSearchQuery(e.target.value);
                        searchProfiles(e.target.value);
                      }}
                      onFocus={() => {
                        if (profileSearchQuery.length >= 2 && searchedProfiles.length > 0) {
                          setShowProfileDropdown(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay to allow click on dropdown item
                        setTimeout(() => setShowProfileDropdown(false), 200);
                      }}
                      className="pr-10"
                    />
                    {searchingProfiles ? (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-600 animate-spin" />
                    ) : (
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}

                    {/* Profile Dropdown */}
                    {showProfileDropdown && searchedProfiles.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchedProfiles.map((profile) => (
                          <button
                            key={profile.id}
                            type="button"
                            onClick={() => selectProfile(profile)}
                            className="w-full px-3 py-2 text-left hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                          >
                            <div className="font-medium text-sm">{profile.user_name || 'No Name'}</div>
                            <div className="text-xs text-gray-600">{profile.user_phoneno}</div>
                            {profile.recipient_address_line1 && (
                              <div className="text-xs text-gray-500 mt-0.5 truncate">{profile.recipient_address_line1}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-600">
                    {searchingProfiles ? 'Searching...' : 'Search existing customer to auto-fill recipient details (type at least 2 characters)'}
                  </p>
                </div>

                <Separator />

                {/* Recipient Information */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Recipient Information</h4>
                  <div>
                    <label className="text-sm font-medium">Recipient Name *</label>
                    <Input
                      type="text"
                      placeholder="Enter recipient name"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone Number *</label>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Province *</label>
                    <Select value={recipientProvince} onValueChange={setRecipientProvince}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.id} value={province.id.toString()}>
                            {province.province_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Delivery Address *</label>
                    <Textarea
                      placeholder="Enter full delivery address"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Special Requests / Notes</label>
                    <Textarea
                      placeholder="e.g., Deliver after 5 PM, gift wrap requested, etc."
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      className="mt-1 min-h-[60px]"
                    />
                  </div>
                </div>

                <Separator />

                {/* Shipping Courier */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Shipping Courier</h4>
                  <div>
                    <label className="text-sm font-medium">Select Courier *</label>
                    <Select
                      value={shippingCourier}
                      onValueChange={(value) => {
                        setShippingCourier(value);
                        if (value !== 'custom') {
                          setCustomCourier('');
                        }
                      }}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose courier service" />
                      </SelectTrigger>
                      <SelectContent>
                        {couriers.map((courier) => (
                          <SelectItem key={courier.id} value={courier.id.toString()}>
                            {courier.courier_name}
                          </SelectItem>
                        ))}
                        <SelectItem value="pickup">Customer Pickup</SelectItem>
                        <SelectItem value="custom">Other (Manual Input)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {shippingCourier === 'custom' && (
                    <div>
                      <label className="text-sm font-medium">Courier Name *</label>
                      <Input
                        type="text"
                        placeholder="Enter courier name"
                        value={customCourier}
                        onChange={(e) => setCustomCourier(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}

                  {/* Total Weight Display */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">Total Package Weight</p>
                    <p className="text-2xl font-bold text-blue-700">{totalWeightKg} kg</p>
                    <p className="text-xs text-blue-600 mt-1">({totalWeightGrams} grams)</p>
                  </div>

                  {/* Shipping Cost Input */}
                  <div>
                    <label className="text-sm font-medium">
                      Shipping Cost (Rp) {shippingCost && shippingCourier !== 'custom' && shippingCourier !== 'pickup' && recipientProvince && (
                        <span className="text-green-600 text-xs ml-1">✓ Auto-calculated</span>
                      )}
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter shipping cost or auto-calculate"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {totalWeightGrams < 1000
                        ? `Under 1kg - using base rate for ${recipientProvince ? provinces.find(p => p.id.toString() === recipientProvince)?.province_name : 'selected province'}`
                        : `${totalWeightKg} kg - calculated per kg rate`
                      }
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Auto-Applied Promotion Display */}
                {appliedPromotion && discountAmount > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-green-900">
                            {appliedPromotion.code}
                          </p>
                          {/* Discount Type Badge */}
                          <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-800 border-green-300">
                            {appliedPromotion.discount_type === 'percentage' && `${appliedPromotion.discount_value}% OFF`}
                            {appliedPromotion.discount_type === 'fixed' && `${formatPrice(appliedPromotion.discount_value)} OFF`}
                            {appliedPromotion.discount_type === 'buy_x_get_y' && `Buy ${appliedPromotion.buy_quantity} Get ${appliedPromotion.get_quantity} Free`}
                            {appliedPromotion.discount_type === 'buy_more_save_more' && 'Buy More Save More'}
                            {appliedPromotion.discount_type === 'free_shipping' && 'Free Shipping'}
                          </Badge>
                          {appliedPromotion.free_shipping && appliedPromotion.discount_type !== 'free_shipping' && (
                            <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 border-blue-300">
                              + Free Shipping
                            </Badge>
                          )}
                        </div>
                        {appliedPromotion.description && (
                          <p className="text-xs text-green-700 mt-1">
                            {appliedPromotion.description}
                          </p>
                        )}
                        <p className="text-sm text-green-600 mt-2 font-bold">
                          You save: {formatPrice(discountAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && appliedPromotion && (
                    <div className="flex justify-between text-sm text-green-600 font-medium">
                      <span className="flex items-center gap-1">
                        Discount
                        <span className="text-[10px] text-green-500">
                          ({appliedPromotion.discount_type === 'percentage' && `${appliedPromotion.discount_value}%`}
                          {appliedPromotion.discount_type === 'fixed' && 'Fixed'}
                          {appliedPromotion.discount_type === 'buy_x_get_y' && `B${appliedPromotion.buy_quantity}G${appliedPromotion.get_quantity}`}
                          {appliedPromotion.discount_type === 'buy_more_save_more' && 'Tiered'}
                          {appliedPromotion.discount_type === 'free_shipping' && 'Free Ship'})
                        </span>
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Shipping ({totalWeightKg} kg)</span>
                      {shippingCourier !== 'custom' && shippingCourier !== 'pickup' && recipientProvince && shippingCostAmount > 0 && (
                        <span className="text-xs text-green-600">✓ Auto</span>
                      )}
                    </div>
                    <span>{shippingCostAmount > 0 ? formatPrice(shippingCostAmount) : 'Rp 0'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total Amount</span>
                    <span className="text-primary">{formatPrice(total)}</span>
                  </div>
                  <p className="text-xs text-gray-500 pt-1">
                    Subtotal: {formatPrice(subtotal)}
                    {discountAmount > 0 && ` - Discount: ${formatPrice(discountAmount)}`}
                    {` + Shipping: ${shippingCostAmount > 0 ? formatPrice(shippingCostAmount) : 'Rp 0'}`}
                    {' = '}{formatPrice(total)}
                  </p>
                </div>

                <Separator />

                {/* Payment Method */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Cash - Always available for POS */}
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => setPaymentMethod('cash')}
                      type="button"
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Cash
                    </Button>

                    {/* Bank Transfer - Only if enabled */}
                    {storeSettings.payment.bankTransferEnabled && (
                      <Button
                        variant={paymentMethod === 'bank_transfer' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setPaymentMethod('bank_transfer')}
                        type="button"
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        Bank Transfer
                      </Button>
                    )}

                    {/* E-Wallet - Only if enabled */}
                    {storeSettings.payment.ewalletEnabled && (
                      <Button
                        variant={paymentMethod === 'ewallet' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setPaymentMethod('ewallet')}
                        type="button"
                      >
                        <Smartphone className="mr-2 h-4 w-4" />
                        E-Wallet
                      </Button>
                    )}

                    {/* QRIS - Only if enabled */}
                    {storeSettings.payment.qrisEnabled && (
                      <Button
                        variant={paymentMethod === 'qris' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => setPaymentMethod('qris')}
                        type="button"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        QRIS
                      </Button>
                    )}
                  </div>
                </div>

                {/* Payment Method Details */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Cash Received</label>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    {cashAmount >= total && (
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-600">Change</p>
                        <p className="text-2xl font-bold text-green-700">
                          {formatPrice(change)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && storeSettings.payment.bankTransferEnabled && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-900">Bank Transfer Details</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Bank</span>
                        <span className="font-medium text-blue-900">{storeSettings.payment.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Number</span>
                        <span className="font-mono font-medium text-blue-900">{storeSettings.payment.bankAccountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Name</span>
                        <span className="font-medium text-blue-900">{storeSettings.payment.bankAccountName}</span>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Customer should transfer exact amount: <strong>{formatPrice(total)}</strong>
                    </p>
                  </div>
                )}

                {paymentMethod === 'ewallet' && storeSettings.payment.ewalletEnabled && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-purple-600" />
                      <h4 className="font-semibold text-purple-900">E-Wallet Details</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-purple-700">Provider</span>
                        <span className="font-medium text-purple-900">{storeSettings.payment.ewalletProvider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Number</span>
                        <span className="font-mono font-medium text-purple-900">{storeSettings.payment.ewalletNumber}</span>
                      </div>
                    </div>
                    <p className="text-xs text-purple-600 mt-2">
                      Customer should transfer exact amount: <strong>{formatPrice(total)}</strong>
                    </p>
                  </div>
                )}

                {paymentMethod === 'qris' && storeSettings.payment.qrisEnabled && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-orange-600" />
                      <h4 className="font-semibold text-orange-900">QRIS Payment</h4>
                    </div>

                    {/* QRIS Image */}
                    {storeSettings.payment.qrisImage && (
                      <div className="flex justify-center">
                        <img
                          src={storeSettings.payment.qrisImage}
                          alt="QRIS Code"
                          className="w-40 h-40 object-contain border border-orange-200 rounded-lg bg-white p-2"
                        />
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {storeSettings.payment.qrisName && (
                        <div className="flex justify-between">
                          <span className="text-orange-700">Merchant Name</span>
                          <span className="font-medium text-orange-900">{storeSettings.payment.qrisName}</span>
                        </div>
                      )}
                      {storeSettings.payment.qrisNmid && (
                        <div className="flex justify-between">
                          <span className="text-orange-700">NMID</span>
                          <span className="font-mono font-medium text-orange-900">{storeSettings.payment.qrisNmid}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-orange-600 mt-2 text-center">
                      Scan QR code and pay: <strong>{formatPrice(total)}</strong>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {checkoutStep === 'details' ? (
              <>
                <Button variant="outline" onClick={() => setCheckoutOpen(false)} type="button">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    // Validate recipient and shipping data
                    if (!recipientName.trim()) {
                      toast.error('Please enter recipient name');
                      return;
                    }
                    if (!recipientPhone.trim()) {
                      toast.error('Please enter phone number');
                      return;
                    }
                    if (!recipientProvince) {
                      toast.error('Please select province');
                      return;
                    }
                    if (!recipientAddress.trim()) {
                      toast.error('Please enter delivery address');
                      return;
                    }
                    if (!shippingCourier) {
                      toast.error('Please select shipping courier');
                      return;
                    }
                    if (shippingCourier === 'custom' && !customCourier.trim()) {
                      toast.error('Please enter courier name');
                      return;
                    }
                    setCheckoutStep('payment');
                  }}
                  type="button"
                >
                  Continue to Payment
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCheckoutStep('details')} type="button">
                  Back
                </Button>
                <Button
                  onClick={processCheckout}
                  disabled={
                    processing ||
                    (paymentMethod === 'cash' && cashAmount < total)
                  }
                  type="button"
                >
                  {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Complete Sale
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Variant</DialogTitle>
            <DialogDescription>
              Choose a variant for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-96">
            <div className="grid grid-cols-2 gap-4">
              {/* Base Product Option - Only show if product does NOT have variants */}
              {selectedProduct && !selectedProduct.has_variants && (
                <button
                  onClick={() => {
                    if (selectedProduct.stock_quantity <= 0) {
                      toast.error('Out of Stock, please contact admin');
                      return;
                    }
                    addToCart(selectedProduct, null);
                  }}
                  className={`border rounded-lg p-4 text-left transition-all relative ${
                    selectedProduct.stock_quantity <= 0
                      ? 'border-red-200 opacity-75 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary hover:shadow-md'
                  }`}
                >
                  {selectedProduct.stock_quantity <= 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      OUT OF STOCK
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {selectedProduct.main_image_url ? (
                      <img
                        src={selectedProduct.main_image_url}
                        alt={selectedProduct.name}
                        className={`w-16 h-16 object-cover rounded-lg ${selectedProduct.stock_quantity <= 0 ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                        <PawPrint className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-medium text-sm mb-1 ${selectedProduct.stock_quantity <= 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                        Base Product (No Variant)
                      </p>
                      <p className={`font-bold ${selectedProduct.stock_quantity <= 0 ? 'text-gray-400' : 'text-primary'}`}>
                        {formatPrice(selectedProduct.base_price)}
                      </p>
                      <Badge
                        variant={selectedProduct.stock_quantity > 0 ? "secondary" : "destructive"}
                        className="mt-1 text-xs"
                      >
                        {selectedProduct.stock_quantity > 0 ? `Stock: ${selectedProduct.stock_quantity}` : 'No Stock'}
                      </Badge>
                    </div>
                  </div>
                </button>
              )}

              {/* Variant Options - Always show all variants */}
              {selectedProduct?.variants?.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => {
                    if (variant.stock_quantity <= 0) {
                      toast.error('Out of Stock, please contact admin');
                      return;
                    }
                    addToCart(selectedProduct, variant);
                  }}
                  className={`border rounded-lg p-4 text-left transition-all relative ${
                    variant.stock_quantity <= 0
                      ? 'border-red-200 opacity-75 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary hover:shadow-md'
                  }`}
                >
                  {variant.stock_quantity <= 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded">
                      OUT OF STOCK
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    {variant.variant_image_url || selectedProduct.main_image_url ? (
                      <img
                        src={variant.variant_image_url || selectedProduct.main_image_url || ''}
                        alt={variant.variant_name}
                        className={`w-16 h-16 object-cover rounded-lg ${variant.stock_quantity <= 0 ? 'grayscale' : ''}`}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={`font-medium text-sm mb-1 ${variant.stock_quantity <= 0 ? 'text-gray-500' : 'text-gray-900'}`}>
                        {variant.variant_name}
                      </p>
                      {variant.unit_label && (
                        <p className="text-xs text-gray-600 mb-1">{variant.unit_label}</p>
                      )}
                      <p className={`font-bold ${variant.stock_quantity <= 0 ? 'text-gray-400' : 'text-primary'}`}>
                        {formatPrice(selectedProduct.base_price + variant.price_adjustment)}
                      </p>
                      <Badge
                        variant={variant.stock_quantity > 0 ? "secondary" : "destructive"}
                        className="mt-1 text-xs"
                      >
                        {variant.stock_quantity > 0 ? `Stock: ${variant.stock_quantity}` : 'No Stock'}
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}

              {/* Empty state when no options available */}
              {selectedProduct &&
               selectedProduct.stock_quantity <= 0 &&
               (!selectedProduct.variants || selectedProduct.variants.length === 0) && (
                <div className="col-span-2 text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No stock available</p>
                  <p className="text-sm text-gray-400 mt-1">All variants are out of stock</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}