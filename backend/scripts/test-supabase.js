#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hfnsgdeitwuhovcupqdn.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbnNnZGVpdHd1aG92Y3VwcWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMDM3MiwiZXhwIjoyMDc3MDA2MzcyfQ.znhWCKc7cTjWd8NGr-ukzO3TDpiLYxLMNzizPCjZaFs';

async function test() {
  console.log('🧪 Testing Supabase...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const tables = ['users', 'categories', 'brands', 'products', 'product_images', 'orders', 'order_items', 'reviews', 'cart', 'wishlist', 'notifications'];

    for (const table of tables) {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) {
        console.error(`❌ Table '${table}':`, error.message);
        console.log('\n💡 Apply schema: database/supabase-schema.sql in Supabase SQL Editor\n');
        process.exit(1);
      }
      console.log(`✅ ${table}`);
    }

    console.log('\n🎉 All tables ready!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
