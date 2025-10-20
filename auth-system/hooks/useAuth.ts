/**
 * useAuth Hook
 * Main authentication hook with session management
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  AuthUser,
  UserProfile,
  LoginCredentials,
  RegisterCredentials,
  PasswordResetRequest,
  PasswordChange,
  AuthResponse,
  Permission,
  UserRole,
} from '@/types/auth';
import { ROLE_PERMISSIONS } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = getSupabaseClient();

  // =====================================================
  // FETCH USER PROFILE
  // =====================================================

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return data as UserProfile;
      } catch (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
    },
    [supabase]
  );

  // =====================================================
  // SESSION MANAGEMENT
  // =====================================================

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user as AuthUser);

          const userProfile = await fetchProfile(currentSession.user.id);
          setProfile(userProfile);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Auth state change:', event);

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user as AuthUser);

        const userProfile = await fetchProfile(currentSession.user.id);
        setProfile(userProfile);
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }

      setLoading(false);

      // Handle specific events
      if (event === 'SIGNED_OUT') {
        router.push('/auth/login');
      } else if (event === 'PASSWORD_RECOVERY') {
        router.push('/auth/reset-password/confirm');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchProfile]);

  // =====================================================
  // SIGN IN
  // =====================================================

  const signIn = async (
    credentials: LoginCredentials
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;

      // Log audit event
      await fetch('/api/auth/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'user.login',
          user_id: data.user?.id,
        }),
      });

      return { success: true, data: data.user };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'SIGNIN_ERROR',
          message: error.message || 'Anmeldung fehlgeschlagen',
        },
      };
    }
  };

  // =====================================================
  // SIGN UP
  // =====================================================

  const signUp = async (
    credentials: RegisterCredentials
  ): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name,
            phone: credentials.phone,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // Log audit event
      await fetch('/api/auth/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'user.register',
          user_id: data.user?.id,
        }),
      });

      return {
        success: true,
        data: {
          user: data.user,
          message:
            'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.',
        },
      };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'SIGNUP_ERROR',
          message: error.message || 'Registrierung fehlgeschlagen',
        },
      };
    }
  };

  // =====================================================
  // SIGN OUT
  // =====================================================

  const signOut = async (): Promise<void> => {
    try {
      // Log audit event before signing out
      if (user) {
        await fetch('/api/auth/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'user.logout',
            user_id: user.id,
          }),
        });
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // =====================================================
  // PASSWORD RESET
  // =====================================================

  const resetPassword = async (
    request: PasswordResetRequest
  ): Promise<AuthResponse> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        request.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
        }
      );

      if (error) throw error;

      return {
        success: true,
        data: {
          message:
            'Passwort-Zurücksetzungslink wurde an Ihre E-Mail-Adresse gesendet.',
        },
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'RESET_ERROR',
          message:
            error.message || 'Passwort-Zurücksetzung fehlgeschlagen',
        },
      };
    }
  };

  // =====================================================
  // UPDATE PASSWORD
  // =====================================================

  const updatePassword = async (
    data: PasswordChange
  ): Promise<AuthResponse> => {
    try {
      // Verify current password first
      if (!user?.email) {
        throw new Error('Benutzer nicht angemeldet');
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: data.current_password,
      });

      if (signInError) {
        throw new Error('Aktuelles Passwort ist falsch');
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: data.new_password,
      });

      if (updateError) throw updateError;

      // Log audit event
      await fetch('/api/auth/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password.change',
          user_id: user.id,
        }),
      });

      return {
        success: true,
        data: { message: 'Passwort erfolgreich geändert' },
      };
    } catch (error: any) {
      console.error('Password update error:', error);
      return {
        success: false,
        error: {
          code: error.code || 'UPDATE_ERROR',
          message: error.message || 'Passwortänderung fehlgeschlagen',
        },
      };
    }
  };

  // =====================================================
  // REFRESH SESSION
  // =====================================================

  const refreshSession = async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user as AuthUser);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  };

  // =====================================================
  // PERMISSION CHECKS
  // =====================================================

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!profile) return false;

      const rolePermissions = ROLE_PERMISSIONS[profile.role];

      return rolePermissions.some(
        (p) =>
          (p.resource === '*' || p.resource === permission.resource) &&
          (p.action === permission.action || p.action === '*')
      );
    },
    [profile]
  );

  const hasRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!profile) return false;

      if (Array.isArray(role)) {
        return role.includes(profile.role);
      }

      return profile.role === role;
    },
    [profile]
  );

  // =====================================================
  // RETURN
  // =====================================================

  return {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    refreshSession,
    hasPermission,
    hasRole,
  };
}
