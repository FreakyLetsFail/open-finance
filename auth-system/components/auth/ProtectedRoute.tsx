/**
 * Protected Route Component
 * Wrapper for routes that require authentication and/or specific roles
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requireActive?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requireActive = true,
  redirectTo = '/auth/login',
  fallback,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Profile not loaded
      if (!profile) {
        router.push(redirectTo);
        return;
      }

      // Check if account is active
      if (requireActive && profile.status !== 'active') {
        router.push(`${redirectTo}?error=account_inactive`);
        return;
      }

      // Check role requirements
      if (requiredRoles && requiredRoles.length > 0) {
        if (!requiredRoles.includes(profile.role)) {
          router.push('/dashboard?error=insufficient_permissions');
          return;
        }
      }
    }
  }, [user, profile, loading, requiredRoles, requireActive, redirectTo, router]);

  // Loading state
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lädt...</p>
          </div>
        </div>
      )
    );
  }

  // Not authenticated or insufficient permissions
  if (!user || !profile) {
    return null;
  }

  if (requireActive && profile.status !== 'active') {
    return null;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.includes(profile.role)) {
      return null;
    }
  }

  // Authorized
  return <>{children}</>;
}

// Convenience components for common role restrictions
export function AdminRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute requiredRoles={[UserRole.ADMIN]} {...props}>
      {children}
    </ProtectedRoute>
  );
}

export function TreasurerRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.ADMIN, UserRole.TREASURER]}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function BoardMemberRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      requiredRoles={[UserRole.ADMIN, UserRole.TREASURER, UserRole.BOARD_MEMBER]}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}

export function MemberRoute({ children, ...props }: Omit<ProtectedRouteProps, 'requiredRoles'>) {
  return (
    <ProtectedRoute
      requiredRoles={[
        UserRole.ADMIN,
        UserRole.TREASURER,
        UserRole.BOARD_MEMBER,
        UserRole.MEMBER,
      ]}
      {...props}
    >
      {children}
    </ProtectedRoute>
  );
}
