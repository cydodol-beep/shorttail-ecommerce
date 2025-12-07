/**
 * Quick script to check if logo exists in database
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase
    .from('store_settings')
    .select('id, store_name, store_logo, updated_at')
    .single();

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  console.log('\n=== Store Settings Check ===');
  console.log('ID:', data.id);
  console.log('Store Name:', data.store_name);
  console.log('Updated At:', new Date(data.updated_at).toLocaleString());
  console.log('\nLogo Status:');
  
  if (!data.store_logo) {
    console.log('❌ NO LOGO - Field is empty or null');
  } else {
    const len = data.store_logo.length;
    const isBase64 = data.store_logo.startsWith('data:');
    const isUrl = data.store_logo.startsWith('http');
    
    console.log(`✅ LOGO EXISTS - ${len} characters`);
    console.log(`Type: ${isBase64 ? 'Base64 Data URL' : isUrl ? 'External URL' : 'Unknown'}`);
    
    if (isBase64) {
      const match = data.store_logo.match(/^data:([^;]+);/);
      if (match) {
        console.log(`Format: ${match[1]}`);
      }
      console.log(`Preview: ${data.store_logo.substring(0, 80)}...`);
    } else {
      console.log(`URL: ${data.store_logo}`);
    }
  }
  console.log('\n');
}

check();
