/**
 * Authentication Middleware
 * Protects routes and handles session management
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/server';

// =====================================================
// ROUTE CONFIGURATION
// =====================================================

const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/reset-password',
  '/auth/callback',
  '/api/auth/callback',
];

const AUTH_ROUTES = ['/auth/login', '/auth/register'];

const PROTECTED_ROUTES = [
  '/dashboard',
  '/finances',
  '/members',
  '/reports',
  '/settings',
  '/profile',
];

const ADMIN_ROUTES = ['/admin', '/settings/users', '/settings/roles'];

// =====================================================
// MIDDLEWARE
// =====================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Create Supabase client
  const response = NextResponse.next();
  const supabase = createMiddlewareClient(request, response);

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isAdminRoute = ADMIN_ROUTES.some((route) => pathname.startsWith(route));

  // =====================================================
  // REDIRECT LOGIC
  // =====================================================

  // If user is logged in and tries to access auth pages, redirect to dashboard
  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not logged in and tries to access protected route, redirect to login
  if (!session && isProtectedRoute) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access for admin routes
  if (isAdminRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', session.user.id)
      .single();

    if (!profile || profile.role !== 'admin' || profile.status !== 'active') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Check user status for protected routes
  if (isProtectedRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', session.user.id)
      .single();

    // Redirect inactive or suspended users
    if (profile?.status !== 'active') {
      await supabase.auth.signOut();
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set(
        'error',
        'account_inactive'
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  // =====================================================
  // SECURITY HEADERS
  // =====================================================

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // CSP header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co;"
  );

  return response;
}

// =====================================================
// MIDDLEWARE CONFIG
// =====================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
