/**
 * Refresh Token API Route
 * Handles token refresh for maintaining user sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createToken, setSessionCookie, getRefreshToken } from '@/lib/auth/session'
import { supabaseAdmin } from '@/lib/supabase/server'
import { refreshTokenSchema } from '@/lib/validation/auth-schemas'
import { ZodError } from 'zod'

/**
 * POST /api/auth/refresh
 * Refresh the access token using a refresh token
 */
export async function POST(request: NextRequest) {
  try {
    // Try to get refresh token from cookie or body
    let refreshToken = await getRefreshToken()

    if (!refreshToken) {
      const body = await request.json()
      const validatedData = refreshTokenSchema.parse(body)
      refreshToken = validatedData.refreshToken
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'Refresh token is required',
          code: 'TOKEN_REQUIRED'
        },
        { status: 400 }
      )
    }

    // Verify refresh token
    const payload = await verifyToken(refreshToken)

    if (!payload || payload.type !== 'refresh') {
      return NextResponse.json(
        {
          error: 'Invalid or expired refresh token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      )
    }

    // Fetch latest user data
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', payload.userId)
      .single()

    if (error || !user) {
      return NextResponse.json(
        {
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Create new access token
    const newAccessToken = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    })

    // Set new session cookie
    await setSessionCookie(newAccessToken)

    // Calculate expiry time
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    return NextResponse.json(
      {
        success: true,
        token: newAccessToken,
        expiresAt: expiresAt.toISOString(),
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
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

    console.error('Token refresh error:', error)

    return NextResponse.json(
      {
        error: 'Failed to refresh token',
        code: 'REFRESH_FAILED'
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
