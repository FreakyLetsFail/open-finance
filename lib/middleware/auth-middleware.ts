/**
 * Authentication Middleware
 * Protects API routes and validates user permissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/session'
import { hasPermission, UserRole, Permission } from '@/lib/auth/roles'
import { JWTPayload } from '@/types/auth.types'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

/**
 * Extract token from request headers
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Check cookie
  const cookieToken = request.cookies.get('auth-token')
  if (cookieToken) {
    return cookieToken.value
  }

  return null
}

/**
 * Middleware to authenticate requests
 */
export async function authenticate(
  request: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  const token = extractToken(request)

  if (!token) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED' },
      { status: 401 }
    )
  }

  const payload = await verifyToken(token)

  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
      { status: 401 }
    )
  }

  return { user: payload }
}

/**
 * Middleware to check if user has required permission
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  const userRole = user.role as UserRole

  if (!hasPermission(userRole, permission)) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permission
      },
      { status: 403 }
    )
  }

  return { user }
}

/**
 * Middleware to check if user has any of the required permissions
 */
export async function requireAnyPermission(
  request: NextRequest,
  permissions: Permission[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  const userRole = user.role as UserRole

  const hasAnyPerm = permissions.some(permission =>
    hasPermission(userRole, permission)
  )

  if (!hasAnyPerm) {
    return NextResponse.json(
      {
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: permissions
      },
      { status: 403 }
    )
  }

  return { user }
}

/**
 * Middleware to check if user has a specific role
 */
export async function requireRole(
  request: NextRequest,
  roles: UserRole | UserRole[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (!allowedRoles.includes(user.role as UserRole)) {
    return NextResponse.json(
      {
        error: 'Insufficient role',
        code: 'FORBIDDEN',
        required: allowedRoles
      },
      { status: 403 }
    )
  }

  return { user }
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export async function optionalAuthenticate(
  request: NextRequest
): Promise<{ user: JWTPayload | null }> {
  const token = extractToken(request)

  if (!token) {
    return { user: null }
  }

  const payload = await verifyToken(token)

  return { user: payload }
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(
  request: NextRequest,
  resourceUserId: string
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  // Admins can access any resource
  if (user.role === UserRole.ADMIN) {
    return { user }
  }

  // Check ownership
  if (user.userId !== resourceUserId) {
    return NextResponse.json(
      {
        error: 'You do not have access to this resource',
        code: 'FORBIDDEN'
      },
      { status: 403 }
    )
  }

  return { user }
}
