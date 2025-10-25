/**
 * Database Helper
 * Provides direct access to Supabase client
 * Use Supabase's query builder for all operations
 */

const { supabase } = require('./supabase');

/**
 * Get Supabase client
 * @returns {Object} Supabase client instance
 */
function getClient() {
  return supabase;
}

/**
 * Helper function to get a connection-like object for compatibility
 * This allows gradual migration from MySQL to Supabase
 */
async function getConnection() {
  // Return the supabase client wrapped in a connection-like interface
  return {
    supabase,
    // Dummy methods for MySQL compatibility
    end: async () => Promise.resolve(),
    beginTransaction: async () => Promise.resolve(),
    commit: async () => Promise.resolve(),
    rollback: async () => Promise.resolve()
  };
}

module.exports = {
  supabase,
  getClient,
  getConnection
};
