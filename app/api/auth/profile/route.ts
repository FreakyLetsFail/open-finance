/**
 * User Profile API Routes
 * Handles profile retrieval and updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticate } from '@/lib/middleware/auth-middleware'
import { supabaseAdmin } from '@/lib/supabase/server'
import { updateProfileSchema, changePasswordSchema } from '@/lib/validation/auth-schemas'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { ZodError } from 'zod'

/**
 * GET /api/auth/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    // Fetch user profile from database
    const { data: profile, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, phone_number, date_of_birth, role, email_verified, created_at, updated_at')
      .eq('id', user.userId)
      .single()

    if (error || !profile) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        user: {
          id: profile.id,
          email: profile.email,
          firstName: profile.first_name,
          lastName: profile.last_name,
          phoneNumber: profile.phone_number,
          dateOfBirth: profile.date_of_birth,
          role: profile.role,
          emailVerified: profile.email_verified,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Profile fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        code: 'PROFILE_FETCH_FAILED'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/auth/profile
 * Update current user's profile
 */
export async function PATCH(request: NextRequest) {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    const body = await request.json()

    // Validate input
    const validatedData = updateProfileSchema.parse(body)

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString()
    }

    if (validatedData.firstName) {
      updates.first_name = validatedData.firstName
    }

    if (validatedData.lastName) {
      updates.last_name = validatedData.lastName
    }

    if (validatedData.phoneNumber !== undefined) {
      updates.phone_number = validatedData.phoneNumber
    }

    if (validatedData.dateOfBirth !== undefined) {
      updates.date_of_birth = validatedData.dateOfBirth
    }

    // Update profile in database
    const { data: updatedProfile, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', user.userId)
      .select('id, email, first_name, last_name, phone_number, date_of_birth, role, email_verified')
      .single()

    if (error) {
      console.error('Profile update error:', error)
      throw new Error('Failed to update profile')
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: updatedProfile.id,
          email: updatedProfile.email,
          firstName: updatedProfile.first_name,
          lastName: updatedProfile.last_name,
          phoneNumber: updatedProfile.phone_number,
          dateOfBirth: updatedProfile.date_of_birth,
          role: updatedProfile.role,
          emailVerified: updatedProfile.email_verified
        }
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Profile update error:', error)

    return NextResponse.json(
      {
        error: 'Failed to update profile',
        code: 'PROFILE_UPDATE_FAILED'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/profile/password
 * Change user's password
 */
export async function PUT(request: NextRequest) {
  const authResult = await authenticate(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  try {
    const body = await request.json()

    // Validate input
    const validatedData = changePasswordSchema.parse(body)

    // Fetch current password hash
    const { data: userData, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('password_hash')
      .eq('id', user.userId)
      .single()

    if (fetchError || !userData) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      validatedData.currentPassword,
      userData.password_hash
    )

    if (!isValidPassword) {
      return NextResponse.json(
        {
          error: 'Current password is incorrect',
          code: 'INVALID_PASSWORD'
        },
        { status: 400 }
      )
    }

    // Hash new password
    const newPasswordHash = await hashPassword(validatedData.newPassword)

    // Update password
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.userId)

    if (updateError) {
      console.error('Password change error:', updateError)
      throw new Error('Failed to change password')
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password changed successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error('Password change error:', error)

    return NextResponse.json(
      {
        error: 'Failed to change password',
        code: 'PASSWORD_CHANGE_FAILED'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PATCH, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
