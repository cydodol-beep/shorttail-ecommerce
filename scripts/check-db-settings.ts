/**
 * Script to check and verify store settings in Supabase database
 * Run with: npx tsx scripts/check-db-settings.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSettings() {
  console.log('🔍 Checking store settings in database...\n');

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching settings:', error.message);
      return;
    }

    if (!data) {
      console.warn('⚠️  No store settings found in database');
      console.log('\nTo create default settings, run the migration:');
      console.log('004_store_settings.sql');
      return;
    }

    console.log('✅ Store settings found!\n');
    console.log('📊 Settings Summary:');
    console.log('-------------------');
    console.log(`ID: ${data.id}`);
    console.log(`Store Name: ${data.store_name}`);
    console.log(`Store Email: ${data.store_email}`);
    console.log(`Store Phone: ${data.store_phone}`);
    console.log(`Store Address: ${data.store_address}, ${data.store_city}, ${data.store_province}`);
    console.log(`\n🖼️  Logo Status:`);
    
    if (data.store_logo) {
      const logoLength = data.store_logo.length;
      const isBase64 = data.store_logo.startsWith('data:');
      const isUrl = data.store_logo.startsWith('http');
      
      console.log(`  ✅ Logo exists (${logoLength} characters)`);
      console.log(`  Type: ${isBase64 ? 'Base64 Data URL' : isUrl ? 'URL' : 'Unknown'}`);
      
      if (isBase64) {
        const preview = data.store_logo.substring(0, 60) + '...';
        console.log(`  Preview: ${preview}`);
      } else {
        console.log(`  URL: ${data.store_logo}`);
      }
    } else {
      console.log('  ❌ No logo found (empty or null)');
    }

    console.log('\n💰 Payment Settings:');
    console.log(`  Bank Transfer: ${data.bank_transfer_enabled ? '✅' : '❌'}`);
    if (data.bank_transfer_enabled) {
      console.log(`    Bank: ${data.bank_name}`);
      console.log(`    Account: ${data.bank_account_number} (${data.bank_account_name})`);
    }
    console.log(`  E-Wallet: ${data.ewallet_enabled ? '✅' : '❌'}`);
    console.log(`  COD: ${data.enable_cod ? '✅' : '❌'}`);

    console.log('\n🚚 Shipping Settings:');
    console.log(`  Free Shipping: ${data.free_shipping_enabled ? '✅' : '❌'}`);
    if (data.free_shipping_enabled) {
      console.log(`    Threshold: ${data.free_shipping_threshold}`);
    }
    console.log(`  Default Fee: ${data.default_shipping_fee}`);

    console.log('\n🎁 Loyalty Settings:');
    console.log(`  Points Enabled: ${data.points_enabled ? '✅' : '❌'}`);
    if (data.points_enabled) {
      console.log(`    Points per ${data.points_per_rupiah} IDR: 1 point`);
    }

    console.log('\n📅 Timestamps:');
    console.log(`  Created: ${new Date(data.created_at).toLocaleString()}`);
    console.log(`  Updated: ${new Date(data.updated_at).toLocaleString()}`);

  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

// Run the check
checkSettings().then(() => {
  console.log('\n✨ Check complete!');
  process.exit(0);
});
