/**
 * Audit Log API Route
 * Records authentication and authorization events
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { AuditAction } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get request body
    const body = await request.json();
    const { action, user_id, entity_type, entity_id, old_values, new_values } = body;

    // Validate action
    if (!action || !Object.values(AuditAction).includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid audit action',
          },
        },
        { status: 400 }
      );
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert audit log
    const { data, error } = await supabase
      .from('audit_logs')
      .insert({
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single();

    if (error) {
      console.error('Audit log error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUDIT_LOG_ERROR',
            message: 'Failed to create audit log',
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Audit API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Not authenticated',
          },
        },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Non-admin users can only see their own logs
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        logs: data,
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Audit logs fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch audit logs',
        },
      },
      { status: 500 }
    );
  }
}
