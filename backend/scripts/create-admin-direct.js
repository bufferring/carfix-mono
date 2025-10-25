#!/usr/bin/env node
const https = require('https');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://hfnsgdeitwuhovcupqdn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbnNnZGVpdHd1aG92Y3VwcWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMDM3MiwiZXhwIjoyMDc3MDA2MzcyfQ.znhWCKc7cTjWd8NGr-ukzO3TDpiLYxLMNzizPCjZaFs';

async function createAdmin() {
  console.log('🚀 Creating admin user via REST API...\n');
  
  const hashedPassword = await bcrypt.hash('r00tr00t', 10);
  
  const userData = JSON.stringify({
    name: 'Manny Admin',
    email: 'manny@carfixve.app',
    password: hashedPassword,
    role: 'admin',
    is_verified: true,
    is_active: true
  });

  const url = new URL(SUPABASE_URL);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: '/rest/v1/users',
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 201) {
        const user = JSON.parse(data);
        console.log('✅ Admin user created!');
        console.log(`   Email: manny@carfixve.app`);
        console.log(`   Password: r00tr00t`);
        console.log(`   ID: ${user[0].id}\n`);
      } else if (res.statusCode === 409) {
        console.log('✅ Admin user already exists');
        console.log(`   Email: manny@carfixve.app\n`);
      } else {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data, '\n');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error:', error.message);
  });

  req.write(userData);
  req.end();
}

createAdmin();
