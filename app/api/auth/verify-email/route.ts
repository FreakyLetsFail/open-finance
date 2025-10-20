/**
 * Email Verification API Route
 * Handles email verification with token
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyEmailSchema } from '@/lib/validation/auth-schemas'
import { ZodError } from 'zod'

/**
 * POST /api/auth/verify-email
 * Verify user's email with token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = verifyEmailSchema.parse(body)

    // Verify the token using Supabase Auth
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(
      validatedData.token
    )

    if (verifyError || !user) {
      return NextResponse.json(
        {
          error: 'Invalid or expired verification token',
          code: 'INVALID_TOKEN'
        },
        { status: 400 }
      )
    }

    // Update email verification status in database
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        email_verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('email', user.email)

    if (updateError) {
      console.error('Email verification update error:', updateError)
      throw new Error('Failed to verify email')
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email verified successfully'
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

    console.error('Email verification error:', error)

    return NextResponse.json(
      {
        error: 'Failed to verify email',
        code: 'VERIFICATION_FAILED'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/verify-email/resend
 * Resend verification email
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        {
          error: 'Email is required',
          code: 'EMAIL_REQUIRED'
        },
        { status: 400 }
      )
    }

    // Check if user exists and is not verified
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, email_verified')
      .eq('email', email)
      .single()

    if (userError || !user) {
      // Don't reveal if email exists
      return NextResponse.json(
        {
          success: true,
          message: 'If the email exists and is not verified, a verification link has been sent'
        },
        { status: 200 }
      )
    }

    if (user.email_verified) {
      return NextResponse.json(
        {
          error: 'Email is already verified',
          code: 'ALREADY_VERIFIED'
        },
        { status: 400 }
      )
    }

    // Resend verification email using Supabase Auth
    const { error: resendError } = await supabaseAdmin.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email`
      }
    })

    if (resendError) {
      console.error('Resend verification error:', resendError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'If the email exists and is not verified, a verification link has been sent'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Resend verification error:', error)

    return NextResponse.json(
      {
        error: 'Failed to resend verification email',
        code: 'RESEND_FAILED'
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
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
