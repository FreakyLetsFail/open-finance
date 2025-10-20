/**
 * Authentication & Authorization Type Definitions
 * Type-safe interfaces for the authentication system
 */

import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// =====================================================
// ENUMS
// =====================================================

export enum UserRole {
  ADMIN = 'admin',
  TREASURER = 'treasurer',
  BOARD_MEMBER = 'board_member',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

// =====================================================
// USER PROFILE
// =====================================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar_url?: string;

  // Two-Factor Authentication
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  two_factor_backup_codes?: string[];

  // Security tracking
  last_login_at?: string;
  last_login_ip?: string;
  failed_login_attempts: number;
  locked_until?: string;
  password_changed_at: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

// =====================================================
// AUTHENTICATION
// =====================================================

export interface AuthUser extends SupabaseUser {
  profile?: UserProfile;
}

export interface AuthSession {
  user: AuthUser;
  session: Session;
}

export interface LoginCredentials {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

// =====================================================
// TWO-FACTOR AUTHENTICATION
// =====================================================

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface TwoFactorVerifyRequest {
  code: string;
}

export interface TwoFactorBackupCode {
  code: string;
  used_at?: string;
}

// =====================================================
// AUDIT LOG
// =====================================================

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export enum AuditAction {
  USER_LOGIN = 'user.login',
  USER_LOGOUT = 'user.logout',
  USER_REGISTER = 'user.register',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  PASSWORD_CHANGE = 'password.change',
  PASSWORD_RESET_REQUEST = 'password.reset_request',
  PASSWORD_RESET_CONFIRM = 'password.reset_confirm',
  TWO_FACTOR_ENABLE = 'two_factor.enable',
  TWO_FACTOR_DISABLE = 'two_factor.disable',
  TWO_FACTOR_VERIFY = 'two_factor.verify',
  ROLE_CHANGE = 'role.change',
  STATUS_CHANGE = 'status.change',
}

// =====================================================
// PERMISSIONS
// =====================================================

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

export type RolePermissions = {
  [K in UserRole]: Permission[];
};

// Permission matrix (example)
export const ROLE_PERMISSIONS: RolePermissions = {
  [UserRole.ADMIN]: [
    { resource: '*', action: 'create' },
    { resource: '*', action: 'read' },
    { resource: '*', action: 'update' },
    { resource: '*', action: 'delete' },
  ],
  [UserRole.TREASURER]: [
    { resource: 'finances', action: 'create' },
    { resource: 'finances', action: 'read' },
    { resource: 'finances', action: 'update' },
    { resource: 'finances', action: 'delete' },
    { resource: 'reports', action: 'read' },
    { resource: 'members', action: 'read' },
  ],
  [UserRole.BOARD_MEMBER]: [
    { resource: 'finances', action: 'read' },
    { resource: 'reports', action: 'read' },
    { resource: 'members', action: 'read' },
    { resource: 'members', action: 'update' },
  ],
  [UserRole.MEMBER]: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'public', action: 'read' },
  ],
  [UserRole.GUEST]: [
    { resource: 'public', action: 'read' },
  ],
};

// =====================================================
// API RESPONSES
// =====================================================

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface AuthError {
  code: string;
  message: string;
  status?: number;
}

// =====================================================
// CONTEXT & STATE
// =====================================================

export interface AuthContextValue {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (credentials: RegisterCredentials) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
  resetPassword: (request: PasswordResetRequest) => Promise<AuthResponse>;
  updatePassword: (data: PasswordChange) => Promise<AuthResponse>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}
