/**
 * 2FA Setup API Route
 * Initialize two-factor authentication for user
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/server';
import { generateTwoFactorSecret } from '@/lib/auth/two-factor';

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

    // Check if 2FA is already enabled
    const { data: profile } = await supabase
      .from('profiles')
      .select('two_factor_enabled')
      .eq('id', user.id)
      .single();

    if (profile?.two_factor_enabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_ENABLED',
            message: '2FA is already enabled',
          },
        },
        { status: 400 }
      );
    }

    // Generate 2FA secret and QR code
    const twoFactorData = await generateTwoFactorSecret(user.email!);

    // Store encrypted secret temporarily (will be confirmed after verification)
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        two_factor_secret: twoFactorData.encrypted_secret,
        two_factor_backup_codes: twoFactorData.encrypted_backup_codes,
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Return QR code and backup codes (don't return encrypted versions)
    return NextResponse.json({
      success: true,
      data: {
        qr_code: twoFactorData.qr_code,
        // Backup codes will be shown after verification
      },
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SETUP_ERROR',
          message: 'Failed to setup 2FA',
        },
      },
      { status: 500 }
    );
  }
}
