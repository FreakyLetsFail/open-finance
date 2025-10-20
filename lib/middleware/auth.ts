import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { JWTPayload } from '@/types/auth.types'

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload
}

export async function authenticateRequest(
  request: NextRequest
): Promise<{ user: JWTPayload | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)
    const user = verifyToken(token)

    return { user, error: null }
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : 'Authentication failed'
    }
  }
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { user, error } = await authenticateRequest(request)

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: error || 'Authentication required' },
        { status: 401 }
      )
    }

    // Attach user to request
    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user

    return handler(authenticatedRequest)
  }
}

export function withOptionalAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { user } = await authenticateRequest(request)

    const authenticatedRequest = request as AuthenticatedRequest
    authenticatedRequest.user = user || undefined

    return handler(authenticatedRequest)
  }
}
