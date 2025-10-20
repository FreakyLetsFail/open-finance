import { NextRequest, NextResponse } from 'next/server'
import { createClient, getUser } from '@/lib/auth/supabase-server'
import { requirePermission } from '@/lib/auth/permissions'
import { contributionSchema, contributionQuerySchema } from '@/lib/validations/contributions'

// GET /api/contributions - List contributions with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    await requirePermission('contributions', 'read')

    const { searchParams } = new URL(request.url)
    const query = contributionQuerySchema.parse(Object.fromEntries(searchParams))

    const supabase = await createClient()

    let queryBuilder = supabase
      .from('contributions')
      .select(`
        *,
        member:members(id, first_name, last_name, member_number, email)
      `, { count: 'exact' })

    // Apply filters
    if (query.member_id) {
      queryBuilder = queryBuilder.eq('member_id', query.member_id)
    }
    if (query.frequency) {
      queryBuilder = queryBuilder.eq('frequency', query.frequency)
    }
    if (query.is_active !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.is_active)
    }
    if (query.search) {
      queryBuilder = queryBuilder.or(`notes.ilike.%${query.search}%`)
    }

    // Pagination
    const from = (query.page - 1) * query.limit
    const to = from + query.limit - 1

    const { data, error, count } = await queryBuilder
      .order('start_date', { ascending: false })
      .range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / query.limit)
      }
    })

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten' }, { status: 500 })
  }
}

// POST /api/contributions - Create new contribution
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    await requirePermission('contributions', 'create')

    const body = await request.json()
    const validatedData = contributionSchema.parse(body)

    const supabase = await createClient()

    // Verify member exists
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('id', validatedData.member_id)
      .single()

    if (!member) {
      return NextResponse.json(
        { error: 'Mitglied nicht gefunden' },
        { status: 404 }
      )
    }

    const { data, error } = await supabase
      .from('contributions')
      .insert(validatedData)
      .select(`
        *,
        member:members(id, first_name, last_name, member_number, email)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ein unerwarteter Fehler ist aufgetreten' }, { status: 500 })
  }
}
