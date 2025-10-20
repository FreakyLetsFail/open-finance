/**
 * Members API Routes - Individual Member Operations
 * Handles GET, PUT, DELETE for specific members
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { updateMemberSchema } from '@/lib/members/validation';
import { handleCorsPreFlight, cors } from '@/lib/middleware/cors';
import { verifyAuth } from '@/lib/auth/verify';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/members/[id] - Get a specific member
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
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

    const { id } = params;

    // Fetch member with related data
    const { data: member, error } = await supabaseAdmin
      .from('members')
      .select(`
        *,
        consents:member_consents(*),
        documents:member_documents(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !member) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
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
      exitDate: member.exit_date,
      monthlyFee: member.monthly_fee,
      paymentMethod: member.payment_method,
      iban: member.iban,
      bic: member.bic,
      notes: member.notes,
      tags: member.tags,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
      consents: member.consents?.map((c: any) => ({
        id: c.id,
        memberId: c.member_id,
        consentType: c.consent_type,
        consentPurpose: c.consent_purpose,
        granted: c.granted,
        grantedAt: c.granted_at,
        revokedAt: c.revoked_at,
        legalBasis: c.legal_basis,
        consentText: c.consent_text,
        consentVersion: c.consent_version,
        createdAt: c.created_at
      })),
      documents: member.documents?.filter((d: any) => !d.deleted_at).map((d: any) => ({
        id: d.id,
        memberId: d.member_id,
        documentType: d.document_type,
        documentName: d.document_name,
        filePath: d.file_path,
        fileSize: d.file_size,
        mimeType: d.mime_type,
        category: d.category,
        tags: d.tags,
        containsPersonalData: d.contains_personal_data,
        createdAt: d.created_at
      }))
    };

    const response = NextResponse.json({
      success: true,
      data: transformedMember
    });

    return cors(request, response);
  } catch (error) {
    console.error('Member GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/members/[id] - Update a member
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) return preflightResponse;

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

    const { id } = params;
    const body = await request.json();

    // Validate input
    const validationResult = updateMemberSchema.safeParse({ ...body, id });
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

    const updateData = validationResult.data;

    // Check if member exists
    const { data: existingMember } = await supabaseAdmin
      .from('members')
      .select('id, email')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== existingMember.email) {
      const { data: emailConflict } = await supabaseAdmin
        .from('members')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', id)
        .is('deleted_at', null)
        .single();

      if (emailConflict) {
        return NextResponse.json(
          { success: false, error: 'Email already in use by another member' },
          { status: 409 }
        );
      }
    }

    // Prepare update object
    const dbUpdate: any = {
      updated_by: auth.user.userId
    };

    if (updateData.firstName) dbUpdate.first_name = updateData.firstName;
    if (updateData.lastName) dbUpdate.last_name = updateData.lastName;
    if (updateData.email) dbUpdate.email = updateData.email;
    if (updateData.dateOfBirth !== undefined) dbUpdate.date_of_birth = updateData.dateOfBirth;
    if (updateData.gender) dbUpdate.gender = updateData.gender;
    if (updateData.phone !== undefined) dbUpdate.phone = updateData.phone;
    if (updateData.mobile !== undefined) dbUpdate.mobile = updateData.mobile;
    if (updateData.street !== undefined) dbUpdate.street = updateData.street;
    if (updateData.houseNumber !== undefined) dbUpdate.house_number = updateData.houseNumber;
    if (updateData.postalCode !== undefined) dbUpdate.postal_code = updateData.postalCode;
    if (updateData.city !== undefined) dbUpdate.city = updateData.city;
    if (updateData.country !== undefined) dbUpdate.country = updateData.country;
    if (updateData.membershipType) dbUpdate.membership_type = updateData.membershipType;
    if (updateData.status) dbUpdate.status = updateData.status;
    if (updateData.entryDate) dbUpdate.entry_date = updateData.entryDate;
    if (updateData.exitDate !== undefined) dbUpdate.exit_date = updateData.exitDate;
    if (updateData.monthlyFee !== undefined) dbUpdate.monthly_fee = updateData.monthlyFee;
    if (updateData.paymentMethod !== undefined) dbUpdate.payment_method = updateData.paymentMethod;
    if (updateData.iban !== undefined) dbUpdate.iban = updateData.iban;
    if (updateData.bic !== undefined) dbUpdate.bic = updateData.bic;
    if (updateData.notes !== undefined) dbUpdate.notes = updateData.notes;
    if (updateData.tags !== undefined) dbUpdate.tags = updateData.tags;

    // Update member
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .from('members')
      .update(dbUpdate)
      .eq('id', id)
      .select()
      .single();

    if (updateError || !updatedMember) {
      console.error('Member update error:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update member' },
        { status: 500 }
      );
    }

    // Transform response
    const transformedMember = {
      id: updatedMember.id,
      memberNumber: updatedMember.member_number,
      firstName: updatedMember.first_name,
      lastName: updatedMember.last_name,
      email: updatedMember.email,
      phone: updatedMember.phone,
      mobile: updatedMember.mobile,
      dateOfBirth: updatedMember.date_of_birth,
      gender: updatedMember.gender,
      street: updatedMember.street,
      houseNumber: updatedMember.house_number,
      postalCode: updatedMember.postal_code,
      city: updatedMember.city,
      country: updatedMember.country,
      membershipType: updatedMember.membership_type,
      status: updatedMember.status,
      entryDate: updatedMember.entry_date,
      exitDate: updatedMember.exit_date,
      monthlyFee: updatedMember.monthly_fee,
      paymentMethod: updatedMember.payment_method,
      iban: updatedMember.iban,
      bic: updatedMember.bic,
      notes: updatedMember.notes,
      tags: updatedMember.tags,
      createdAt: updatedMember.created_at,
      updatedAt: updatedMember.updated_at
    };

    const response = NextResponse.json({
      success: true,
      data: transformedMember,
      message: 'Member updated successfully'
    });

    return cors(request, response);
  } catch (error) {
    console.error('Member update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/members/[id] - Soft delete a member (DSGVO-compliant)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  const preflightResponse = handleCorsPreFlight(request);
  if (preflightResponse) return preflightResponse;

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

    const { id } = params;

    // Check if member exists
    const { data: existingMember } = await supabaseAdmin
      .from('members')
      .select('id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (!existingMember) {
      return NextResponse.json(
        { success: false, error: 'Member not found' },
        { status: 404 }
      );
    }

    // Soft delete (set deleted_at timestamp)
    const { error: deleteError } = await supabaseAdmin
      .from('members')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: auth.user.userId,
        status: 'cancelled'
      })
      .eq('id', id);

    if (deleteError) {
      console.error('Member deletion error:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete member' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Member deleted successfully'
    });

    return cors(request, response);
  } catch (error) {
    console.error('Member deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
