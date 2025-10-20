import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { accountCreationSchema, paginationSchema } from '@/lib/validation/schemas'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'

// GET /api/accounts - List user's accounts
export async function GET(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user?.userId
      const { searchParams } = new URL(req.url)

      // Parse pagination
      const pagination = paginationSchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit')
      })

      const offset = (pagination.page - 1) * pagination.limit

      // Get accounts with pagination
      const { data: accounts, error, count } = await supabaseAdmin
        .from('accounts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1)

      if (error) {
        console.error('Accounts fetch error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch accounts' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(
        {
          accounts: accounts || [],
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / pagination.limit)
          }
        },
        { status: 200 }
      )

      return cors(request, response)
    } catch (error) {
      console.error('Get accounts error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user?.userId
      const body = await req.json()

      // Validate input
      const validationResult = accountCreationSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.errors
          },
          { status: 400 }
        )
      }

      const { accountType, accountName, currency, initialBalance } = validationResult.data

      // Create account
      const { data: account, error } = await supabaseAdmin
        .from('accounts')
        .insert({
          user_id: userId!,
          account_type: accountType,
          account_name: accountName,
          currency,
          balance: initialBalance
        })
        .select()
        .single()

      if (error || !account) {
        console.error('Account creation error:', error)
        return NextResponse.json(
          { error: 'Failed to create account' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(account, { status: 201 })
      return cors(request, response)
    } catch (error) {
      console.error('Create account error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
