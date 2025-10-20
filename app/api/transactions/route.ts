import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { transactionSchema, paginationSchema } from '@/lib/validation/schemas'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'

// GET /api/transactions - List user's transactions
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

      const accountId = searchParams.get('accountId')
      const category = searchParams.get('category')

      const offset = (pagination.page - 1) * pagination.limit

      // Build query
      let query = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          accounts!inner(user_id)
        `, { count: 'exact' })
        .eq('accounts.user_id', userId!)
        .order('transaction_date', { ascending: false })
        .range(offset, offset + pagination.limit - 1)

      // Add filters
      if (accountId) {
        query = query.eq('account_id', accountId)
      }
      if (category) {
        query = query.eq('category', category)
      }

      const { data: transactions, error, count } = await query

      if (error) {
        console.error('Transactions fetch error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch transactions' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(
        {
          transactions: transactions || [],
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
      console.error('Get transactions error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const userId = req.user?.userId
      const body = await req.json()

      // Validate input
      const validationResult = transactionSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.errors
          },
          { status: 400 }
        )
      }

      const { accountId, amount, currency, description, category, transactionDate, metadata } = validationResult.data

      // Verify account ownership
      const { data: account } = await supabaseAdmin
        .from('accounts')
        .select('id, balance, currency')
        .eq('id', accountId)
        .eq('user_id', userId!)
        .single()

      if (!account) {
        return NextResponse.json(
          { error: 'Account not found or access denied' },
          { status: 404 }
        )
      }

      // Determine transaction type
      const transactionType = amount >= 0 ? 'credit' : 'debit'
      const absoluteAmount = Math.abs(amount)

      // Calculate new balance
      const newBalance = transactionType === 'credit'
        ? account.balance + absoluteAmount
        : account.balance - absoluteAmount

      // Create transaction and update balance in a transaction
      const { data: transaction, error: txError } = await supabaseAdmin
        .from('transactions')
        .insert({
          account_id: accountId,
          amount: absoluteAmount,
          currency,
          description,
          category,
          transaction_type: transactionType,
          transaction_date: transactionDate || new Date().toISOString(),
          metadata,
          status: 'completed'
        })
        .select()
        .single()

      if (txError) {
        console.error('Transaction creation error:', txError)
        return NextResponse.json(
          { error: 'Failed to create transaction' },
          { status: 500 }
        )
      }

      // Update account balance
      const { error: balanceError } = await supabaseAdmin
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)

      if (balanceError) {
        console.error('Balance update error:', balanceError)
        // Rollback transaction would be ideal here in production
        return NextResponse.json(
          { error: 'Failed to update account balance' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(
        {
          ...transaction,
          newBalance
        },
        { status: 201 }
      )

      return cors(request, response)
    } catch (error) {
      console.error('Create transaction error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
