/**
 * Logout API Route
 * Handles user logout by clearing session cookies
 */

import { NextRequest, NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  try {
    // Clear session cookies
    await clearSession()

    return NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Logout error:', error)

    return NextResponse.json(
      {
        error: 'Failed to logout',
        code: 'LOGOUT_FAILED'
      },
      { status: 500 }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
