import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10) // 15 minutes

export function rateLimit(options?: {
  maxRequests?: number
  windowMs?: number
}) {
  const maxRequests = options?.maxRequests || MAX_REQUESTS
  const windowMs = options?.windowMs || WINDOW_MS

  return async (request: NextRequest) => {
    const identifier = getIdentifier(request)
    const now = Date.now()

    // Clean up old entries
    if (store[identifier]?.resetTime < now) {
      delete store[identifier]
    }

    // Initialize or get current count
    if (!store[identifier]) {
      store[identifier] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    // Increment count
    store[identifier].count++

    // Check if rate limit exceeded
    if (store[identifier].count > maxRequests) {
      const retryAfter = Math.ceil((store[identifier].resetTime - now) / 1000)

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': store[identifier].resetTime.toString()
          }
        }
      )
    }

    return null // Continue processing
  }
}

function getIdentifier(request: NextRequest): string {
  // Try to get user ID from token first
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    // Extract user ID from token if available
    try {
      const token = authHeader.substring(7)
      // This is a simple approach; in production, decode the token
      return `user:${token.substring(0, 20)}`
    } catch {
      // Fall through to IP-based limiting
    }
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for')
  const ip = forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60000) // Clean up every minute
