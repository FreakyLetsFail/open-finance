/**
 * Supabase Client Configuration
 * Type-safe client for browser and server environments
 */

import { createBrowserClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// =====================================================
// BROWSER CLIENT
// =====================================================

export function createClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      flowType: 'pkce', // More secure auth flow
    },
    global: {
      headers: {
        'X-Client-Info': 'vereinsfinanzverwaltung@1.0.0',
      },
    },
  });
}

// =====================================================
// SERVER CLIENT (Service Role)
// =====================================================

export function createServiceClient() {
  if (!supabaseServiceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// =====================================================
// SINGLETON INSTANCES
// =====================================================

// Browser client singleton
let browserClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    // Server-side: create new client each time
    return createClient();
  }

  // Browser: reuse singleton
  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}

// =====================================================
// TYPE EXPORTS
// =====================================================

export type SupabaseClient = ReturnType<typeof createClient>;
export type SupabaseServiceClient = ReturnType<typeof createServiceClient>;
