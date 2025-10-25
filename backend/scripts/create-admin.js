#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://loviagjwpzcquxhsexzo.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvdmlhZ2p3cHpjcXV4aHNleHpvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDE3MDQ1NiwiZXhwIjoyMDc1NzQ2NDU2fQ.x93yc1GNwNofFLoOwl_wos0BPzVv5DSGgIjZUoMM5fY';

async function createAdmin() {
  console.log('🚀 Creating admin user...\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Check if admin exists
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('email', 'manny@carfixve.app')
      .single();

    if (existing) {
      console.log('✅ Admin user already exists');
      console.log(`   Email: ${existing.email}`);
      console.log(`   Role: ${existing.role}\n`);
      
      if (existing.role !== 'admin') {
        await supabase
          .from('users')
          .update({ role: 'admin', is_verified: true, is_active: true })
          .eq('id', existing.id);
        console.log('✅ Updated to admin role\n');
      }
      return;
    }

    // Create admin
    const hashedPassword = await bcrypt.hash('r00tr00t', 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: 'Manny Admin',
        email: 'manny@carfixve.app',
        password: hashedPassword,
        role: 'admin',
        is_verified: true,
        is_active: true
      }])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Admin user created!');
    console.log(`   Email: manny@carfixve.app`);
    console.log(`   Password: r00tr00t`);
    console.log(`   ID: ${data.id}\n`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
