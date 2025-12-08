import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read environment variables
const envContent = readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Need: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('📦 Applying Related Products Migration...\n');

// Execute migration SQL directly
const migrationSQL = readFileSync('supabase/migrations/021_related_products.sql', 'utf8');

// For Supabase, we need to execute this via the SQL editor or split it properly
// Let's create the table and function separately

async function runMigration() {
  try {
    // Check if table exists
    const { data: tableCheck } = await supabase
      .from('product_relations')
      .select('id')
      .limit(1);
    
    if (tableCheck !== null) {
      console.log('✅ product_relations table already exists');
    }
  } catch (err) {
    // Table doesn't exist, create it
    console.log('Creating product_relations table and function...');
    console.log('\n⚠️  Please run the following SQL in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80) + '\n');
    console.log('Or visit: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql');
    console.log('\nAfter running the SQL, the related products feature will be ready!');
  }
}

runMigration();
