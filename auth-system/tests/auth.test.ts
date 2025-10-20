/**
 * Authentication System Tests
 * Comprehensive test suite for auth flows
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import {
  loginSchema,
  registerSchema,
  passwordResetRequestSchema,
  passwordChangeSchema,
} from '@/types/validation';
import {
  hasPermission,
  hasRole,
  hasRoleLevel,
  canManageUser,
} from '@/lib/auth/permissions';
import { UserRole, UserStatus } from '@/types/auth';
import type { UserProfile } from '@/types/auth';

// =====================================================
// VALIDATION TESTS
// =====================================================

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        email: 'test@example.com',
        password: 'validpassword',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'validpassword',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        password_confirm: 'ValidPass123!',
        full_name: 'Max Mustermann',
        terms_accepted: true,
        privacy_accepted: true,
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        password_confirm: 'weak',
        full_name: 'Max Mustermann',
        terms_accepted: true,
        privacy_accepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        password_confirm: 'DifferentPass123!',
        full_name: 'Max Mustermann',
        terms_accepted: true,
        privacy_accepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject without terms acceptance', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'ValidPass123!',
        password_confirm: 'ValidPass123!',
        full_name: 'Max Mustermann',
        terms_accepted: false,
        privacy_accepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate correct password change', () => {
      const validData = {
        current_password: 'OldPassword123!',
        new_password: 'NewPassword123!',
        password_confirm: 'NewPassword123!',
      };

      const result = passwordChangeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject same old and new password', () => {
      const invalidData = {
        current_password: 'SamePassword123!',
        new_password: 'SamePassword123!',
        password_confirm: 'SamePassword123!',
      };

      const result = passwordChangeSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});

// =====================================================
// PERMISSION TESTS
// =====================================================

describe('Permission System', () => {
  const adminProfile: UserProfile = {
    id: '1',
    email: 'admin@test.com',
    full_name: 'Admin User',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    two_factor_enabled: false,
    failed_login_attempts: 0,
    password_changed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const memberProfile: UserProfile = {
    ...adminProfile,
    id: '2',
    email: 'member@test.com',
    full_name: 'Member User',
    role: UserRole.MEMBER,
  };

  const guestProfile: UserProfile = {
    ...adminProfile,
    id: '3',
    email: 'guest@test.com',
    full_name: 'Guest User',
    role: UserRole.GUEST,
  };

  describe('hasPermission', () => {
    it('should grant admin all permissions', () => {
      expect(
        hasPermission(adminProfile, { resource: 'finances', action: 'create' })
      ).toBe(true);
      expect(
        hasPermission(adminProfile, { resource: 'members', action: 'delete' })
      ).toBe(true);
    });

    it('should restrict member permissions', () => {
      expect(
        hasPermission(memberProfile, { resource: 'profile', action: 'read' })
      ).toBe(true);
      expect(
        hasPermission(memberProfile, { resource: 'finances', action: 'create' })
      ).toBe(false);
    });

    it('should restrict guest permissions', () => {
      expect(
        hasPermission(guestProfile, { resource: 'public', action: 'read' })
      ).toBe(true);
      expect(
        hasPermission(guestProfile, { resource: 'members', action: 'read' })
      ).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should check single role', () => {
      expect(hasRole(adminProfile, UserRole.ADMIN)).toBe(true);
      expect(hasRole(memberProfile, UserRole.ADMIN)).toBe(false);
    });

    it('should check multiple roles', () => {
      expect(hasRole(adminProfile, [UserRole.ADMIN, UserRole.TREASURER])).toBe(
        true
      );
      expect(hasRole(guestProfile, [UserRole.ADMIN, UserRole.MEMBER])).toBe(
        false
      );
    });
  });

  describe('hasRoleLevel', () => {
    it('should check role hierarchy', () => {
      expect(hasRoleLevel(adminProfile, UserRole.MEMBER)).toBe(true);
      expect(hasRoleLevel(memberProfile, UserRole.ADMIN)).toBe(false);
      expect(hasRoleLevel(memberProfile, UserRole.MEMBER)).toBe(true);
    });
  });

  describe('canManageUser', () => {
    it('should allow admin to manage all users', () => {
      expect(canManageUser(adminProfile, memberProfile)).toBe(true);
      expect(canManageUser(adminProfile, guestProfile)).toBe(true);
    });

    it('should prevent lower roles from managing higher roles', () => {
      expect(canManageUser(memberProfile, adminProfile)).toBe(false);
    });

    it('should prevent equal role management', () => {
      const member2: UserProfile = { ...memberProfile, id: '4' };
      expect(canManageUser(memberProfile, member2)).toBe(false);
    });
  });
});

// =====================================================
// INTEGRATION TESTS (Require Supabase)
// =====================================================

describe('Authentication Integration', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserId: string;

  beforeEach(() => {
    // Initialize Supabase client with test credentials
    // Note: These should be set up in your test environment
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.warn('Skipping integration tests: Supabase credentials not set');
      return;
    }

    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  });

  afterEach(async () => {
    // Cleanup: Delete test user if created
    if (testUserId && supabase) {
      try {
        await supabase.auth.admin.deleteUser(testUserId);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }
  });

  it('should register a new user', async () => {
    if (!supabase) return;

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
        },
      },
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(testEmail);

    testUserId = data.user?.id || '';
  });

  it('should sign in with valid credentials', async () => {
    if (!supabase) return;

    // First create a user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const { data: signUpData } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    testUserId = signUpData.user?.id || '';

    // Then try to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
  });

  it('should reject invalid credentials', async () => {
    if (!supabase) return;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'WrongPassword123!',
    });

    expect(error).toBeDefined();
    expect(data.user).toBeNull();
    expect(data.session).toBeNull();
  });
});
