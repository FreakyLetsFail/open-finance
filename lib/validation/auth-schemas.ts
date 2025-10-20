/**
 * Zod Validation Schemas for Authentication
 * Validates request bodies and ensures type safety
 */

import { z } from 'zod'

/**
 * Password validation rules
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must not exceed 100 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters')
  .toLowerCase()

/**
 * Login request schema
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export type LoginInput = z.infer<typeof loginSchema>

/**
 * Registration request schema
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Last name contains invalid characters'),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .refine(
      (date) => {
        if (!date) return true
        const birthDate = new Date(date)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        return age >= 18 && age <= 120
      },
      { message: 'User must be at least 18 years old' }
    )
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Password reset request schema
 */
export const resetPasswordRequestSchema = z.object({
  email: emailSchema
})

export type ResetPasswordRequestInput = z.infer<typeof resetPasswordRequestSchema>

/**
 * Password reset confirmation schema
 */
export const resetPasswordConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

export type ResetPasswordConfirmInput = z.infer<typeof resetPasswordConfirmSchema>

/**
 * Change password schema (for authenticated users)
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
})

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

/**
 * Update profile schema
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .regex(/^[a-zA-ZäöüÄÖÜß\s-]+$/, 'Last name contains invalid characters')
    .optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable()
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

/**
 * Email verification schema
 */
export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
})

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>

/**
 * Refresh token schema
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
