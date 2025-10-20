import { getUserRole } from './supabase-server'

export type RoleType = 'admin' | 'treasurer' | 'board_member' | 'auditor' | 'member' | 'guest'

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  admin: [
    { resource: '*', actions: ['create', 'read', 'update', 'delete'] }
  ],
  treasurer: [
    { resource: 'members', actions: ['create', 'read', 'update'] },
    { resource: 'transactions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'contributions', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'categories', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }
  ],
  board_member: [
    { resource: 'members', actions: ['read'] },
    { resource: 'transactions', actions: ['read'] },
    { resource: 'contributions', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }
  ],
  auditor: [
    { resource: 'members', actions: ['read'] },
    { resource: 'transactions', actions: ['read'] },
    { resource: 'contributions', actions: ['read'] },
    { resource: 'audit_log', actions: ['read'] },
    { resource: 'reports', actions: ['read'] }
  ],
  member: [
    { resource: 'members', actions: ['read'] }, // Only own data
    { resource: 'contributions', actions: ['read'] } // Only own data
  ],
  guest: []
}

export async function hasPermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> {
  const role = await getUserRole()

  if (!role) {
    return false
  }

  const permissions = ROLE_PERMISSIONS[role.role_type as RoleType]

  // Check for wildcard permission (admin)
  const wildcardPerm = permissions.find(p => p.resource === '*')
  if (wildcardPerm && wildcardPerm.actions.includes(action)) {
    return true
  }

  // Check for specific resource permission
  const resourcePerm = permissions.find(p => p.resource === resource)
  if (resourcePerm && resourcePerm.actions.includes(action)) {
    return true
  }

  return false
}

export async function requirePermission(
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<void> {
  const allowed = await hasPermission(resource, action)

  if (!allowed) {
    throw new Error('Insufficient permissions')
  }
}
