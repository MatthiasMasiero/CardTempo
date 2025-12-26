// Quick test to verify Supabase connection
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local file manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envLines = envFile.split('\n');
let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1].trim();
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1].trim();
  }
});

console.log('\n=== Testing Supabase Connection ===\n');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ ERROR: Supabase credentials not found in .env.local');
  process.exit(1);
}

if (supabaseKey === 'PASTE_FULL_KEY_HERE') {
  console.log('❌ ERROR: You need to paste your actual Supabase keys!');
  process.exit(1);
}

console.log('✅ Supabase URL configured:', supabaseUrl);
console.log('✅ Supabase Anon Key configured');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
async function testConnection() {
  try {
    console.log('\n📡 Testing connection to Supabase...\n');

    // Try to query (will fail if no tables, but connection works)
    const { data, error } = await supabase.from('users').select('count');

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('✅ Connection successful!');
        console.log('⚠️  Tables not created yet - you need to run the SQL migration');
        console.log('   Go to Supabase → SQL Editor and run the migration from QUICK_SETUP.md\n');
      } else {
        console.log('❌ Connection error:', error.message);
      }
    } else {
      console.log('✅ Connection successful!');
      console.log('✅ Database tables are set up!\n');
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testConnection();
