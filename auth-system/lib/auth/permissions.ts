/**
 * Role-Based Access Control (RBAC) Utilities
 * Permission checking and enforcement
 */

import { UserRole, Permission, ROLE_PERMISSIONS } from '@/types/auth';
import type { UserProfile } from '@/types/auth';

// =====================================================
// PERMISSION CHECKING
// =====================================================

export function hasPermission(
  user: UserProfile | null,
  permission: Permission
): boolean {
  if (!user) return false;

  // Check if user is active
  if (user.status !== 'active') return false;

  const rolePermissions = ROLE_PERMISSIONS[user.role];

  return rolePermissions.some(
    (p) =>
      (p.resource === '*' || p.resource === permission.resource) &&
      (p.action === permission.action)
  );
}

export function hasRole(
  user: UserProfile | null,
  role: UserRole | UserRole[]
): boolean {
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }

  return user.role === role;
}

export function hasAnyRole(
  user: UserProfile | null,
  roles: UserRole[]
): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function hasAllRoles(
  user: UserProfile | null,
  roles: UserRole[]
): boolean {
  if (!user) return false;
  // Single user can only have one role, so check if user's role is in the list
  return roles.length === 1 && roles[0] === user.role;
}

// =====================================================
// ROLE HIERARCHY
// =====================================================

const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 5,
  [UserRole.TREASURER]: 4,
  [UserRole.BOARD_MEMBER]: 3,
  [UserRole.MEMBER]: 2,
  [UserRole.GUEST]: 1,
};

export function hasRoleLevel(
  user: UserProfile | null,
  minimumRole: UserRole
): boolean {
  if (!user) return false;

  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[minimumRole];

  return userLevel >= requiredLevel;
}

export function canManageUser(
  manager: UserProfile | null,
  target: UserProfile
): boolean {
  if (!manager) return false;

  // Admins can manage everyone
  if (manager.role === UserRole.ADMIN) return true;

  // Users cannot manage users with equal or higher role
  const managerLevel = ROLE_HIERARCHY[manager.role];
  const targetLevel = ROLE_HIERARCHY[target.role];

  return managerLevel > targetLevel;
}

// =====================================================
// PERMISSION UTILITIES
// =====================================================

export function getAllPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function canAccessResource(
  user: UserProfile | null,
  resource: string
): boolean {
  if (!user) return false;

  const permissions = ROLE_PERMISSIONS[user.role];

  return permissions.some(
    (p) => p.resource === '*' || p.resource === resource
  );
}

export function canPerformAction(
  user: UserProfile | null,
  resource: string,
  action: Permission['action']
): boolean {
  return hasPermission(user, { resource, action });
}

// =====================================================
// PERMISSION MIDDLEWARE HELPERS
// =====================================================

export interface PermissionCheck {
  type: 'permission' | 'role' | 'roleLevel';
  permission?: Permission;
  role?: UserRole | UserRole[];
  minimumRole?: UserRole;
}

export function checkAccess(
  user: UserProfile | null,
  checks: PermissionCheck[]
): boolean {
  return checks.every((check) => {
    switch (check.type) {
      case 'permission':
        return check.permission
          ? hasPermission(user, check.permission)
          : false;

      case 'role':
        return check.role ? hasRole(user, check.role) : false;

      case 'roleLevel':
        return check.minimumRole
          ? hasRoleLevel(user, check.minimumRole)
          : false;

      default:
        return false;
    }
  });
}

// =====================================================
// COMMON PERMISSION CHECKS
// =====================================================

export const CommonPermissions = {
  // Financial operations
  viewFinances: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'finances', action: 'read' }),

  createTransaction: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'finances', action: 'create' }),

  editTransaction: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'finances', action: 'update' }),

  deleteTransaction: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'finances', action: 'delete' }),

  // Member management
  viewMembers: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'members', action: 'read' }),

  manageMembers: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'members', action: 'update' }),

  // Reports
  viewReports: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'reports', action: 'read' }),

  // Settings
  manageSettings: (user: UserProfile | null) =>
    hasPermission(user, { resource: 'settings', action: 'update' }),

  // User management
  manageUsers: (user: UserProfile | null) =>
    hasRole(user, UserRole.ADMIN),
};
