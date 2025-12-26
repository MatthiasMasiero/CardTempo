// Test signup directly with Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
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

console.log('\n=== Testing Supabase Signup ===\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  try {
    console.log('\n1. Attempting to sign up...');

    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'password123';

    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('\n❌ Signup Error:', error.message);
      console.log('   Error details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('\n✅ Signup successful!');
    console.log('   User ID:', data.user?.id);
    console.log('   Email:', data.user?.email);

    // Wait a moment for trigger
    console.log('\n2. Waiting for trigger to create user record...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if user was created in public.users
    console.log('\n3. Checking public.users table...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (userError) {
      console.log('❌ User not found in public.users table');
      console.log('   Error:', userError.message);
      console.log('\n   This means the trigger did not fire!');
    } else {
      console.log('✅ User found in public.users table');
      console.log('   Data:', JSON.stringify(userData, null, 2));
    }

  } catch (err) {
    console.log('\n❌ Unexpected error:', err);
  }
}

testSignup();
