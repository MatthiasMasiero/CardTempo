#!/usr/bin/env node

/**
 * Test if Resend API key is valid
 * Run: node test-resend-api.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
let RESEND_API_KEY = '';
try {
  const envPath = path.join(__dirname, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^RESEND_API_KEY=(.+)$/m);
  if (match) {
    RESEND_API_KEY = match[1].trim();
  }
} catch (error) {
  console.error('❌ Error reading .env.local:', error.message);
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error('❌ Error: RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

console.log('🔍 Testing Resend API key...');
console.log(`📧 API Key: ${RESEND_API_KEY.substring(0, 10)}...${RESEND_API_KEY.slice(-4)}`);
console.log('');

// Test email payload
const testEmail = {
  from: 'CardTempo <onboarding@resend.dev>',
  to: 'delivered@resend.dev', // Resend's test email
  subject: 'CardTempo - Email Test',
  html: '<p>This is a test email from CardTempo to verify Resend integration.</p>',
};

const data = JSON.stringify(testEmail);

const options = {
  hostname: 'api.resend.com',
  path: '/emails',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log('Response:', body);
    console.log('');

    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! Resend API key is valid');
      console.log('📧 Test email sent successfully');
      console.log('');
      console.log('📝 Next steps:');
      console.log('   1. Check that database tables exist (run check-db-tables.sql in Supabase)');
      console.log('   2. Deploy to Vercel to enable cron job');
      console.log('   3. Add RESEND_API_KEY to Vercel environment variables');
    } else if (res.statusCode === 401) {
      console.log('❌ FAILED! Invalid API key');
      console.log('');
      console.log('🔧 Fix:');
      console.log('   1. Get new API key from https://resend.com/api-keys');
      console.log('   2. Update RESEND_API_KEY in .env.local');
    } else if (res.statusCode === 422) {
      console.log('⚠️  API key valid, but email validation failed');
      console.log('');
      const parsed = JSON.parse(body);
      console.log('Error details:', parsed);
    } else {
      console.log('⚠️  Unexpected response');
      try {
        const parsed = JSON.parse(body);
        console.log('Error details:', parsed);
      } catch (e) {
        console.log('Raw response:', body);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
  console.error('');
  console.error('🔧 Troubleshooting:');
  console.error('   - Check your internet connection');
  console.error('   - Verify firewall settings');
});

req.write(data);
req.end();
