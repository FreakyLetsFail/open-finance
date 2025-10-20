/**
 * Members API Routes - CRUD Operations
 * Handles creation, listing, and search of members with DSGVO compliance
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createMemberSchema, searchMembersSchema } from '@/lib/members/validation';
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors';
import { rateLimit } from '@/lib/middleware/rate-limit';
import { verifyAuth } from '@/lib/auth/verify';

/**
 * GET /api/members - List and search members
 * Query params: query, status, membershipType, tags, page, limit, sortBy, sortOrder
 */
export async function GET(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) return preflightResponse;

  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validationResult = searchMembersSchema.safeParse({
      ...searchParams,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
      limit: searchParams.limit ? parseInt(searchParams.limit) : 20,
      tags: searchParams.tags ? searchParams.tags.split(',') : undefined
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const params = validationResult.data;

    // Build query
    let query = supabaseAdmin
      .from('members')
      .select('*', { count: 'exact' })
      .is('deleted_at', null); // Only non-deleted members

    // Apply filters
    if (params.query) {
      query = query.or(
        `member_number.ilike.%${params.query}%,` +
        `first_name.ilike.%${params.query}%,` +
        `last_name.ilike.%${params.query}%,` +
        `email.ilike.%${params.query}%,` +
        `city.ilike.%${params.query}%`
      );
    }

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.membershipType) {
      query = query.eq('membership_type', params.membershipType);
    }

    if (params.city) {
      query = query.eq('city', params.city);
    }

    if (params.postalCode) {
      query = query.eq('postal_code', params.postalCode);
    }

    if (params.entryDateFrom) {
      query = query.gte('entry_date', params.entryDateFrom);
    }

    if (params.entryDateTo) {
      query = query.lte('entry_date', params.entryDateTo);
    }

    if (params.tags && params.tags.length > 0) {
      query = query.contains('tags', params.tags);
    }

    // Apply sorting
    const sortField = params.sortBy === 'memberNumber' ? 'member_number' :
                      params.sortBy === 'firstName' ? 'first_name' :
                      params.sortBy === 'lastName' ? 'last_name' :
                      params.sortBy === 'entryDate' ? 'entry_date' :
                      params.sortBy === 'createdAt' ? 'created_at' :
                      params.sortBy;

    query = query.order(sortField, { ascending: params.sortOrder === 'asc' });

    // Apply pagination
    const from = (params.page - 1) * params.limit;
    const to = from + params.limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: members, error, count } = await query;

    if (error) {
      console.error('Member query error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    // Transform database response to API response
    const transformedMembers = members?.map(member => ({
      id: member.id,
      memberNumber: member.member_number,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      mobile: member.mobile,
      dateOfBirth: member.date_of_birth,
      gender: member.gender,
      street: member.street,
      houseNumber: member.house_number,
      postalCode: member.postal_code,
      city: member.city,
      country: member.country,
      membershipType: member.membership_type,
      status: member.status,
      entryDate: member.entry_date,
      exitDate: member.exit_date,
      monthlyFee: member.monthly_fee,
      paymentMethod: member.payment_method,
      iban: member.iban,
      bic: member.bic,
      notes: member.notes,
      tags: member.tags,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    }));

    const response = NextResponse.json({
      success: true,
      data: transformedMembers,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit)
      }
    });

    return cors(request, response);
  } catch (error) {
    console.error('Members GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/members - Create a new member
 */
export async function POST(request: NextRequest) {
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) return preflightResponse;

  // Rate limiting - 10 requests per hour for member creation
  const rateLimitResponse = await rateLimit({ maxRequests: 10, windowMs: 3600000 })(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Verify authentication and admin role
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (auth.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = createMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          validationErrors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code
          }))
        },
        { status: 400 }
      );
    }

    const memberData = validationResult.data;

    // Check if email already exists
    const { data: existingMember } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('email', memberData.email)
      .is('deleted_at', null)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Create member (member_number is auto-generated by trigger)
    const { data: member, error: createError } = await supabaseAdmin
      .from('members')
      .insert({
        first_name: memberData.firstName,
        last_name: memberData.lastName,
        email: memberData.email,
        date_of_birth: memberData.dateOfBirth,
        gender: memberData.gender,
        phone: memberData.phone,
        mobile: memberData.mobile,
        street: memberData.street,
        house_number: memberData.houseNumber,
        postal_code: memberData.postalCode,
        city: memberData.city,
        country: memberData.country,
        membership_type: memberData.membershipType,
        status: memberData.status,
        entry_date: memberData.entryDate,
        monthly_fee: memberData.monthlyFee,
        payment_method: memberData.paymentMethod,
        iban: memberData.iban,
        bic: memberData.bic,
        notes: memberData.notes,
        tags: memberData.tags,
        created_by: auth.user.userId
      })
      .select()
      .single();

    if (createError || !member) {
      console.error('Member creation error:', createError);
      return NextResponse.json(
        { success: false, error: 'Failed to create member' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedMember = {
      id: member.id,
      memberNumber: member.member_number,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      mobile: member.mobile,
      dateOfBirth: member.date_of_birth,
      gender: member.gender,
      street: member.street,
      houseNumber: member.house_number,
      postalCode: member.postal_code,
      city: member.city,
      country: member.country,
      membershipType: member.membership_type,
      status: member.status,
      entryDate: member.entry_date,
      monthlyFee: member.monthly_fee,
      paymentMethod: member.payment_method,
      iban: member.iban,
      bic: member.bic,
      notes: member.notes,
      tags: member.tags,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    };

    const response = NextResponse.json(
      {
        success: true,
        data: transformedMember,
        message: 'Member created successfully'
      },
      { status: 201 }
    );

    return cors(request, response);
  } catch (error) {
    console.error('Member creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
