import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'

export async function GET(request: NextRequest) {
  // Handle CORS preflight
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user?.userId

      if (!userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Get user details
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('id, email, first_name, last_name, phone_number, date_of_birth, role, email_verified, created_at')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      const response = NextResponse.json(
        {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phoneNumber: user.phone_number,
          dateOfBirth: user.date_of_birth,
          role: user.role,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        },
        { status: 200 }
      )

      return cors(request, response)
    } catch (error) {
      console.error('Get user error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
