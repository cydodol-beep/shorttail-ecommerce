import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const benefits = [
  { icon: 'truck', title: 'Fast Delivery', description: '2-3 days delivery', color: 'bg-green-100 text-green-600' },
  { icon: 'shield', title: 'Secure Payment', description: 'Protected transactions', color: 'bg-blue-100 text-blue-600' },
  { icon: 'card', title: 'Multiple Payment', description: 'Various methods', color: 'bg-purple-100 text-purple-600' },
  { icon: 'headphones', title: '24/7 Support', description: 'Ready to help anytime', color: 'bg-orange-100 text-orange-600' },
  { icon: 'rotate', title: 'Easy Returns', description: '7-day return policy', color: 'bg-red-100 text-red-600' },
  { icon: 'award', title: 'Quality Guarantee', description: '100% authentic products', color: 'bg-yellow-100 text-yellow-600' },
];

console.log('Updating benefits section settings...');

const { data, error } = await supabase
  .from('landing_page_sections')
  .update({ settings: { benefits } })
  .eq('section_key', 'benefits')
  .select();

if (error) {
  console.error('Error updating benefits:', error);
  process.exit(1);
}

console.log('✅ Benefits section updated successfully!');
console.log('Updated section:', data);
