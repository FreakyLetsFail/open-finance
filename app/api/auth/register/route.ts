import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password'
import { generateToken } from '@/lib/auth/jwt'
import { userRegistrationSchema } from '@/lib/validation/schemas'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'
import { rateLimit } from '@/lib/middleware/rate-limit'

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  // Rate limiting
  const rateLimitResponse = await rateLimit({ maxRequests: 5, windowMs: 3600000 })(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()

    // Validate input
    const validationResult = userRegistrationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const { email, password, firstName, lastName } = validationResult.data

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          error: 'Weak password',
          details: passwordValidation.errors
        },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const { data: user, error: createError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        role: 'user'
      })
      .select('id, email, first_name, last_name, role')
      .single()

    if (createError || !user) {
      console.error('User creation error:', createError)
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
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
          role: user.role
        },
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { status: 201 }
    )

    return cors(request, response)
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
