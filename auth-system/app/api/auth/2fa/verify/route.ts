/**
 * 2FA Verification API Route
 * Verify TOTP code and enable 2FA
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import {
  verifyTwoFactorToken,
  getDecryptedBackupCodes,
} from '@/lib/auth/two-factor';

export async function POST(request: NextRequest) {
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

    // Get request body
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_CODE',
            message: 'Verification code is required',
          },
        },
        { status: 400 }
      );
    }

    // Get user's 2FA secret
    const { data: profile } = await supabase
      .from('profiles')
      .select('two_factor_secret, two_factor_backup_codes')
      .eq('id', user.id)
      .single();

    if (!profile?.two_factor_secret) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SECRET',
            message: '2FA not initialized',
          },
        },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = verifyTwoFactorToken(profile.two_factor_secret, code);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CODE',
            message: 'Invalid verification code',
          },
        },
        { status: 400 }
      );
    }

    // Enable 2FA
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        two_factor_enabled: true,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Log audit event
    await fetch(`${request.nextUrl.origin}/api/auth/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'two_factor.enable',
        user_id: user.id,
      }),
    });

    // Return backup codes
    const backupCodes = getDecryptedBackupCodes(
      profile.two_factor_backup_codes || []
    );

    return NextResponse.json({
      success: true,
      data: {
        message: '2FA successfully enabled',
        backup_codes: backupCodes,
      },
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VERIFICATION_ERROR',
          message: 'Failed to verify 2FA code',
        },
      },
      { status: 500 }
    );
  }
}
