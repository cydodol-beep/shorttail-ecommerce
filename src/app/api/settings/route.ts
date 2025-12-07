import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Exception in settings GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the settings data from request body
    const settings = await request.json();
    
    console.log('Received settings to save:', {
      storeName: settings.store?.storeName,
      hasLogo: !!settings.store?.storeLogo,
      logoLength: settings.store?.storeLogo?.length || 0
    });

    // Transform settings to database format
    const payload = {
      // Store Info
      store_name: settings.store.storeName,
      store_description: settings.store.storeDescription,
      store_logo: settings.store.storeLogo,
      store_email: settings.store.storeEmail,
      store_phone: settings.store.storePhone,
      // Store Address
      store_address: settings.store.storeAddress,
      store_city: settings.store.storeCity,
      store_province: settings.store.storeProvince,
      store_postal_code: settings.store.storePostalCode,
      store_currency: settings.store.storeCurrency,
      store_timezone: settings.store.storeTimezone,
      // Shipping Settings
      free_shipping_enabled: settings.shipping.freeShippingEnabled,
      free_shipping_threshold: settings.shipping.freeShippingThreshold,
      default_shipping_fee: settings.shipping.defaultShippingFee,
      enable_cod: settings.shipping.enableCOD,
      cod_fee: settings.shipping.codFee,
      processing_days: settings.shipping.processingDays,
      // Payment Settings
      bank_transfer_enabled: settings.payment.bankTransferEnabled,
      bank_name: settings.payment.bankName,
      bank_account_number: settings.payment.bankAccountNumber,
      bank_account_name: settings.payment.bankAccountName,
      ewallet_enabled: settings.payment.ewalletEnabled,
      ewallet_provider: settings.payment.ewalletProvider,
      ewallet_number: settings.payment.ewalletNumber,
      qris_enabled: settings.payment.qrisEnabled,
      qris_image: settings.payment.qrisImage || null,
      qris_name: settings.payment.qrisName,
      qris_nmid: settings.payment.qrisNmid,
      // Loyalty Settings
      points_enabled: settings.loyalty.pointsEnabled,
      points_per_rupiah: settings.loyalty.pointsPerRupiah,
      min_points_redeem: settings.loyalty.minPointsRedeem,
      points_value: settings.loyalty.pointsValue,
      referral_bonus: settings.loyalty.referralBonus,
      tier_newborn_threshold: settings.loyalty.tierNewbornThreshold,
      tier_transitional_threshold: settings.loyalty.tierTransitionalThreshold,
      tier_juvenile_threshold: settings.loyalty.tierJuvenileThreshold,
      tier_adolescence_threshold: settings.loyalty.tierAdolescenceThreshold,
      tier_adulthood_threshold: settings.loyalty.tierAdulthoodThreshold,
      // Notification Settings
      email_notifications: settings.notification.emailNotifications,
      order_confirmation: settings.notification.orderConfirmation,
      order_shipped: settings.notification.orderShipped,
      order_delivered: settings.notification.orderDelivered,
      low_stock_alert: settings.notification.lowStockAlert,
      low_stock_threshold: settings.notification.lowStockThreshold,
      new_user_notification: settings.notification.newUserNotification,
      review_notification: settings.notification.reviewNotification,
      updated_at: new Date().toISOString(),
    };

    // Get the first (and only) settings record ID
    const { data: existingSettings, error: fetchError } = await supabase
      .from('store_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching settings ID:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch settings', details: fetchError.message }, { status: 500 });
    }

    let settingsId: string;

    if (existingSettings) {
      // Update existing settings
      settingsId = existingSettings.id;
      const { error: updateError } = await supabase
        .from('store_settings')
        .update(payload)
        .eq('id', settingsId);

      if (updateError) {
        console.error('Error updating settings:', updateError);
        return NextResponse.json({ error: 'Failed to update settings', details: updateError.message }, { status: 500 });
      }
      
      console.log('Settings updated successfully:', settingsId);
    } else {
      // Create new settings record if none exists
      const { data: newSettings, error: insertError } = await supabase
        .from('store_settings')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) {
        console.error('Error creating settings:', insertError);
        return NextResponse.json({ error: 'Failed to create settings', details: insertError.message }, { status: 500 });
      }
      
      settingsId = newSettings.id;
      console.log('Settings created successfully:', settingsId);
    }

    return NextResponse.json({ success: true, id: settingsId });
  } catch (error) {
    console.error('Exception in settings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
