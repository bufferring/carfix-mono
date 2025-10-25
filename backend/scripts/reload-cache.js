#!/usr/bin/env node
const https = require('https');

const SUPABASE_URL = 'https://loviagjwpzcquxhsexzo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdmlhZ2p3cHpjcXV4aHNleHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE3MDQ1NiwiZXhwIjoyMDc1NzQ2NDU2fQ.x93yc1GNwNofFLoOwl_wos0BPzVv5DSGgIjZUoMM5fY';

console.log('🔄 Reloading Supabase schema cache...\n');

const url = new URL(SUPABASE_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: '/rest/v1/rpc/reload_schema',
  method: 'POST',
  headers: {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 204) {
      console.log('✅ Schema cache reloaded successfully!\n');
      console.log('Now you can:');
      console.log('1. Run: bun run create-admin');
      console.log('2. Test: curl https://carfix-vyh2.onrender.com/api/categories\n');
    } else {
      console.log(`Status: ${res.statusCode}`);
      console.log('Response:', data);
      console.log('\n💡 Schema cache reload might not be available via API.');
      console.log('Try restarting your Supabase project or wait a few minutes.\n');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Alternative: Wait 5-10 minutes for Supabase to auto-refresh cache\n');
});

req.end();
