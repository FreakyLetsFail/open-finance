/**
 * Authentication TypeScript Types
 * Type definitions for auth-related data structures
 */

import { UserRole } from '@/lib/auth/roles'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole | 'user' | 'admin'
  type?: 'access' | 'refresh'
  iat?: number
  exp?: number
  iss?: string
  aud?: string
}

export interface AuthResponse {
  success: boolean
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    emailVerified?: boolean
  }
  token: string
  refreshToken?: string
  expiresAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
}

export interface ResetPasswordRequest {
  email: string
}

export interface ResetPasswordConfirm {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  phoneNumber?: string | null
  dateOfBirth?: string | null
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber?: string | null
  dateOfBirth?: string | null
  role: UserRole
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface SessionData {
  userId: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
}
