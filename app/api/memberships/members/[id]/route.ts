import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors'
import { z } from 'zod'

const memberUpdateSchema = z.object({
  salutation: z.enum(['Herr', 'Frau', 'Divers']).optional(),
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  date_of_birth: z.string().optional(),
  street: z.string().max(200).optional(),
  house_number: z.string().max(10).optional(),
  postal_code: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  country: z.string().length(2).optional(),
  membership_end: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'cancelled']).optional(),
  iban: z.string().max(34).optional(),
  bic: z.string().max(11).optional(),
  account_holder: z.string().max(200).optional(),
  sepa_mandate_status: z.enum(['pending', 'active', 'revoked', 'expired']).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional()
})

/**
 * GET /api/memberships/members/[id]
 * Einzelnes Mitglied mit Details abrufen
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = params

      // Fetch member with related data
      const { data: member, error } = await supabaseAdmin
        .from('members')
        .select(`
          *,
          contributions:member_contributions(
            *,
            definition:contribution_definitions(*)
          ),
          invoices:contribution_invoices(
            *,
            payments:contribution_payments(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error || !member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        )
      }

      const response = NextResponse.json(member, { status: 200 })
      return cors(request, response)
    } catch (error) {
      console.error('Get member error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

/**
 * PATCH /api/memberships/members/[id]
 * Mitglied aktualisieren
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = params
      const body = await req.json()

      // Validate input
      const validationResult = memberUpdateSchema.safeParse(body)
      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validationResult.error.errors
          },
          { status: 400 }
        )
      }

      const updateData = validationResult.data

      // Update member
      const { data: member, error: updateError } = await supabaseAdmin
        .from('members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) {
        console.error('Member update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update member' },
          { status: 500 }
        )
      }

      if (!member) {
        return NextResponse.json(
          { error: 'Member not found' },
          { status: 404 }
        )
      }

      const response = NextResponse.json(member, { status: 200 })
      return cors(request, response)
    } catch (error) {
      console.error('Update member error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}

/**
 * DELETE /api/memberships/members/[id]
 * Mitglied löschen
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const preflightResponse = handleCorsPreFlight(request)
  if (preflightResponse) return preflightResponse

  return withAuth(async (req: AuthenticatedRequest) => {
    try {
      const { id } = params

      // Delete member (cascades to related records)
      const { error: deleteError } = await supabaseAdmin
        .from('members')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('Member deletion error:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete member' },
          { status: 500 }
        )
      }

      const response = NextResponse.json(
        { message: 'Member deleted successfully' },
        { status: 200 }
      )
      return cors(request, response)
    } catch (error) {
      console.error('Delete member error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })(request)
}
