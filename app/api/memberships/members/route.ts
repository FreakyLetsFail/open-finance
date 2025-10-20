import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'
import { z } from 'zod'

// Validation Schema
const memberSchema = z.object({
  salutation: z.enum(['Herr', 'Frau', 'Divers']).optional(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(20).optional(),
  date_of_birth: z.string().optional(),
  street: z.string().max(200).optional(),
  house_number: z.string().max(10).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  country: z.string().length(2).default('DE'),
  membership_start: z.string(),
  membership_end: z.string().optional(),
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  account_holder: z.string().max(200).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
})

const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

/**
 * GET /api/memberships/members
 * Liste aller Mitglieder mit Pagination und Filterung
 */
export async function GET(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url)

      // Parse pagination
      const pagination = paginationSchema.parse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit')
      })

      // Filters
      const status = searchParams.get('status')
      const search = searchParams.get('search')
      const sepaMandateStatus = searchParams.get('sepa_mandate_status')

      const offset = (pagination.page - 1) * pagination.limit

      // Build query
      let query = supabaseAdmin
        .from('members')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + pagination.limit - 1)

      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }
      if (sepaMandateStatus) {
        query = query.eq('sepa_mandate_status', sepaMandateStatus)
      }
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,member_number.ilike.%${search}%`)
      }

      const { data: members, error, count } = await query

      if (error) {
        console.error('Members fetch error:', error)
        return NextResponse.json(
          { error: 'Failed to fetch members' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(
        {
          members: members || [],
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
      console.error('Get members error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

/**
 * POST /api/memberships/members
 * Neues Mitglied erstellen
 */
export async function POST(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json()

      // Validate input
      const validationResult = memberSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.errors
          },
          { status: 400 }
        )
      }

      const memberData = validationResult.data

      // Check if email already exists
      const { data: existingMember } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('email', memberData.email)
        .single()

      if (existingMember) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }

      // Create member (member_number will be auto-generated)
      const { data: member, error: createError } = await supabaseAdmin
        .from('members')
        .insert(memberData)
        .select()
        .single()

      if (createError) {
        console.error('Member creation error:', createError)
        return NextResponse.json(
          { error: 'Failed to create member' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(member, { status: 201 })
      return cors(request, response)
    } catch (error) {
      console.error('Create member error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
