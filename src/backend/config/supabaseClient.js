'use strict';
/**
 * supabaseClient.js
 * =================
 * Singleton Supabase client shared across auth and storage operations.
 * Uses the service_role key so server-side operations bypass RLS.
 */

const { createClient } = require('@supabase/supabase-js');

let _client = null;

function getSupabaseClient() {
  if (!_client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.',
      );
    }

    _client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _client;
}

module.exports = { getSupabaseClient };
