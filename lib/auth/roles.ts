/**
 * Role-based Access Control (RBAC) System
 * Defines user roles and their permissions for the Vereinsfinanzverwaltung
 */

export enum UserRole {
  ADMIN = 'admin',
  TREASURER = 'treasurer',
  BOARD_MEMBER = 'board_member',
  MEMBER = 'member',
  GUEST = 'guest'
}

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Account Management
  ACCOUNT_CREATE = 'account:create',
  ACCOUNT_READ = 'account:read',
  ACCOUNT_UPDATE = 'account:update',
  ACCOUNT_DELETE = 'account:delete',

  // Transaction Management
  TRANSACTION_CREATE = 'transaction:create',
  TRANSACTION_READ = 'transaction:read',
  TRANSACTION_UPDATE = 'transaction:update',
  TRANSACTION_DELETE = 'transaction:delete',
  TRANSACTION_APPROVE = 'transaction:approve',

  // Budget Management
  BUDGET_CREATE = 'budget:create',
  BUDGET_READ = 'budget:read',
  BUDGET_UPDATE = 'budget:update',
  BUDGET_DELETE = 'budget:delete',

  // Financial Reports
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  REPORT_ADMIN = 'report:admin',

  // System Settings
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_UPDATE = 'settings:update'
}

// Role to Permissions mapping
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Full access to all permissions
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_READ,
    Permission.ACCOUNT_UPDATE,
    Permission.ACCOUNT_DELETE,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.TRANSACTION_DELETE,
    Permission.TRANSACTION_APPROVE,
    Permission.BUDGET_CREATE,
    Permission.BUDGET_READ,
    Permission.BUDGET_UPDATE,
    Permission.BUDGET_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_ADMIN,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_UPDATE
  ],

  [UserRole.TREASURER]: [
    // Financial management permissions
    Permission.USER_READ,
    Permission.ACCOUNT_CREATE,
    Permission.ACCOUNT_READ,
    Permission.ACCOUNT_UPDATE,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.TRANSACTION_UPDATE,
    Permission.TRANSACTION_APPROVE,
    Permission.BUDGET_CREATE,
    Permission.BUDGET_READ,
    Permission.BUDGET_UPDATE,
    Permission.BUDGET_DELETE,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.SETTINGS_VIEW
  ],

  [UserRole.BOARD_MEMBER]: [
    // Read and basic transaction permissions
    Permission.USER_READ,
    Permission.ACCOUNT_READ,
    Permission.TRANSACTION_CREATE,
    Permission.TRANSACTION_READ,
    Permission.BUDGET_READ,
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT
  ],

  [UserRole.MEMBER]: [
    // Basic read permissions
    Permission.ACCOUNT_READ,
    Permission.TRANSACTION_READ,
    Permission.BUDGET_READ,
    Permission.REPORT_VIEW
  ],

  [UserRole.GUEST]: [
    // Minimal read permissions
    Permission.ACCOUNT_READ,
    Permission.REPORT_VIEW
  ]
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Check if a role can access a specific resource
 */
export function canAccessResource(
  role: UserRole,
  resource: 'user' | 'account' | 'transaction' | 'budget' | 'report' | 'settings',
  action: 'create' | 'read' | 'update' | 'delete'
): boolean {
  const permissionKey = `${resource}:${action}` as Permission
  return hasPermission(role, permissionKey)
}
