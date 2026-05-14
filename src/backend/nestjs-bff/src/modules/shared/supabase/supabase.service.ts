import { Injectable, OnModuleInit } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client wrapper — provides a single shared client instance.
 * Uses the service-role key so domain services can access all schemas.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private _client: SupabaseClient;

  onModuleInit() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.',
      );
    }

    this._client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  get client(): SupabaseClient {
    return this._client;
  }
}
