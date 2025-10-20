/**
 * Password Reset API Routes
 * Handles password reset request and confirmation
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import {
  resetPasswordRequestSchema,
  resetPasswordConfirmSchema
} from '@/lib/validation/auth-schemas'
import { hashPassword } from '@/lib/auth/password'
import { ZodError } from 'zod'

/**
 * POST /api/auth/reset-password
 * Request a password reset email
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = resetPasswordRequestSchema.parse(body)

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name')
      .eq('email', validatedData.email)
      .single()

    if (userError || !user) {
      // Don't reveal if email exists for security
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent'
        },
        { status: 200 }
      )
    }

    // Generate password reset token using Supabase Auth
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
      validatedData.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm`
      }
    )

    if (resetError) {
      console.error('Password reset error:', resetError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent'
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

    console.error('Password reset request error:', error)

    return NextResponse.json(
      {
        error: 'Failed to process password reset request',
        code: 'RESET_REQUEST_FAILED'
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/auth/reset-password
 * Confirm password reset with token and new password
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = resetPasswordConfirmSchema.parse(body)

    // Verify the reset token using Supabase Auth
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(
      validatedData.token
    )

    if (verifyError || !user) {
      return NextResponse.json(
        {
          error: 'Invalid or expired reset token',
          code: 'INVALID_TOKEN'
        },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await hashPassword(validatedData.password)

    // Update password in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('email', user.email)

    if (updateError) {
      console.error('Password update error:', updateError)
      throw new Error('Failed to update password')
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Password has been reset successfully'
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

    console.error('Password reset confirmation error:', error)

    return NextResponse.json(
      {
        error: 'Failed to reset password',
        code: 'RESET_FAILED'
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
      'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
