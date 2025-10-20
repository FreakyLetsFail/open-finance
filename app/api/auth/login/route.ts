import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { verifyPassword } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { userLoginSchema } from '@/lib/validation/schemas'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'
import { rateLimit } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  // Rate limiting - stricter for login attempts
  const rateLimitResponse = await rateLimit({ maxRequests: 5, windowMs: 900000 })(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    // Validate input
    const validationResult = userLoginSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password } = validationResult.data

    // Get user from database
    const { data: user, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id, email, password_hash, first_name, last_name, role, email_verified')
      .eq('email', email)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if email is verified (optional enforcement)
    if (!user.email_verified) {
      console.warn(`User ${user.id} logged in with unverified email`)
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin'
    })

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          emailVerified: user.email_verified
        },
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { status: 200 }
    )

    return cors(request, response)
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
