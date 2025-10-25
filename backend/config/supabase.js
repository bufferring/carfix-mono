/**
 * Supabase Configuration
 * Provides database connection using Supabase PostgreSQL
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://hfnsgdeitwuhovcupqdn.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmbnNnZGVpdHd1aG92Y3VwcWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQzMDM3MiwiZXhwIjoyMDc3MDA2MzcyfQ.znhWCKc7cTjWd8NGr-ukzO3TDpiLYxLMNzizPCjZaFs';

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Execute a raw SQL query
 * @param {string} query - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} Query results
 */
async function query(query, params = []) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: query,
      query_params: params
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Get Supabase client instance
 * @returns {Object} Supabase client
 */
function getClient() {
  return supabase;
}

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

module.exports = {
  supabase,
  getClient,
  query,
  testConnection
};
