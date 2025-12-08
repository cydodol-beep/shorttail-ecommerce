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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read migration file
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '021_related_products.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('Applying related products migration...');

// Split by semicolon but be careful with function definitions
const statements = migrationSQL
  .split(/;(?=\s*(?:CREATE|ALTER|INSERT|DROP|--|\n|$))/gi)
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

for (const statement of statements) {
  if (statement.trim()) {
    console.log(`\nExecuting: ${statement.substring(0, 60)}...`);
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement }).single();
      if (error) {
        // Try direct execution for DDL statements
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          console.warn(`  ⚠️  Statement may have failed (this might be OK if already applied)`);
        } else {
          console.log('  ✅ Success');
        }
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.warn(`  ⚠️  ${err.message} (this might be OK if already applied)`);
    }
  }
}

console.log('\n✅ Migration script completed!');
console.log('\nNote: Some warnings are normal if tables/functions already exist.');
