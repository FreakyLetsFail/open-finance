/**
 * Supabase Server-Side Client
 * For use in Server Components, Server Actions, and Route Handlers
 */

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// =====================================================
// SERVER COMPONENT CLIENT
// =====================================================

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Cookie setting can fail in Server Components
          // This is expected and handled by middleware
        }
      },
      remove(name: string, options) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Cookie removal can fail in Server Components
        }
      },
    },
  });
}

// =====================================================
// ROUTE HANDLER CLIENT
// =====================================================

export async function createRouteHandlerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
}

// =====================================================
// MIDDLEWARE CLIENT
// =====================================================

export function createMiddlewareClient(request: Request, response: Response) {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.headers.get('cookie')?.split('; ')
          .find((c) => c.startsWith(`${name}=`))
          ?.split('=')[1];
      },
      set(name: string, value: string, options) {
        response.headers.append(
          'Set-Cookie',
          `${name}=${value}; Path=/; ${options.maxAge ? `Max-Age=${options.maxAge}; ` : ''}${options.httpOnly ? 'HttpOnly; ' : ''}${options.secure ? 'Secure; ' : ''}${options.sameSite ? `SameSite=${options.sameSite}` : ''}`
        );
      },
      remove(name: string, options) {
        response.headers.append(
          'Set-Cookie',
          `${name}=; Path=/; Max-Age=0; ${options.httpOnly ? 'HttpOnly; ' : ''}${options.secure ? 'Secure; ' : ''}${options.sameSite ? `SameSite=${options.sameSite}` : ''}`
        );
      },
    },
  });
}
