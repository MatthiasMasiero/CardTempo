#!/usr/bin/env node

/**
 * Helper script to manually sync a user's subscription from Stripe
 *
 * Usage:
 *   node sync-user.js <userId>
 *
 * Example:
 *   node sync-user.js 4b9e94f9-f109-4d4e-81e3-08b9258a387a
 */

const https = require('https');

// Configuration
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cardtempo.com';

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID is required');
  console.error('\nUsage: node sync-user.js <userId>');
  console.error('Example: node sync-user.js 4b9e94f9-f109-4d4e-81e3-08b9258a387a');
  process.exit(1);
}

if (!ADMIN_API_KEY) {
  console.error('❌ Error: ADMIN_API_KEY environment variable not set');
  console.error('\nPlease set ADMIN_API_KEY in your .env.local file or environment');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// Validate UUID format
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(userId)) {
  console.error('❌ Error: Invalid user ID format. Must be a valid UUID.');
  console.error('Example: 4b9e94f9-f109-4d4e-81e3-08b9258a387a');
  process.exit(1);
}

console.log('🔄 Syncing subscription for user:', userId);
console.log('📡 API URL:', APP_URL);
console.log('');

const data = JSON.stringify({ userId });

const url = new URL('/api/admin/sync-subscription', APP_URL);
const options = {
  hostname: url.hostname,
  port: url.port || (url.protocol === 'https:' ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ADMIN_API_KEY}`,
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(responseData);

      if (res.statusCode === 200) {
        console.log('✅ Success!');
        console.log('');
        console.log('Subscription Details:');
        console.log('  Tier:', response.tier);
        if (response.tier === 'premium') {
          console.log('  Status:', response.status);
          console.log('  Interval:', response.interval);
          console.log('  Subscription ID:', response.subscriptionId);
        }
        console.log('');
        console.log('✨ User now has', response.tier, 'access');
      } else {
        console.error('❌ Error:', response.error);
        if (response.details) {
          console.error('Details:', response.details);
        }
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', error.message);
      console.error('Raw response:', responseData);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(data);
req.end();
