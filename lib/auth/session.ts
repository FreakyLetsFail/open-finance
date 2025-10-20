/**
 * Session Management Utilities
 * Handles session creation, validation, and token refresh
 */

import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { JWTPayload } from '@/types/auth.types'
import { UserRole } from './roles'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-min-32-characters-long'
)

const TOKEN_EXPIRY = '7d' // 7 days
const REFRESH_TOKEN_EXPIRY = '30d' // 30 days

export interface SessionData {
  userId: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
}

/**
 * Create a JWT token for a user session
 */
export async function createToken(data: SessionData): Promise<string> {
  const token = await new SignJWT({
    userId: data.userId,
    email: data.email,
    role: data.role
  } as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('open-finance')
    .setAudience('open-finance-api')
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)

  return token
}

/**
 * Create a refresh token for long-term session management
 */
export async function createRefreshToken(userId: string): Promise<string> {
  const token = await new SignJWT({ userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('open-finance')
    .setAudience('open-finance-api')
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)

  return token
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'open-finance',
      audience: 'open-finance-api'
    })

    return payload as JWTPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Set session cookie with the access token
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/'
  })
}

/**
 * Set refresh token cookie
 */
export async function setRefreshTokenCookie(refreshToken: string): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set('refresh-token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days in seconds
    path: '/api/auth/refresh'
  })
}

/**
 * Get session from cookie
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')

  if (!token) {
    return null
  }

  return verifyToken(token.value)
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh-token')

  return refreshToken?.value ?? null
}

/**
 * Clear session cookies (logout)
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.delete('auth-token')
  cookieStore.delete('refresh-token')
}

/**
 * Refresh the access token using a refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const payload = await verifyToken(refreshToken)

  if (!payload || payload.type !== 'refresh') {
    return null
  }

  // In a production app, you would fetch the latest user data here
  // For now, we'll create a new token with the userId from the refresh token
  return null // Placeholder - requires database lookup
}

/**
 * Check if a session is valid and not expired
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getSession()

  if (!session) {
    return false
  }

  // Check if token is expired
  if (session.exp && session.exp * 1000 < Date.now()) {
    return false
  }

  return true
}

/**
 * Get user ID from current session
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession()
  return session?.userId ?? null
}

/**
 * Get user role from current session
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getSession()
  return (session?.role as UserRole) ?? null
}
