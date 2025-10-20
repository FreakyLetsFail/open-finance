import { NextRequest, NextResponse } from 'next/server'

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000'
]

export function cors(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get('origin')

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  )
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With'
  )
  response.headers.set('Access-Control-Max-Age', '86400')
  response.headers.set('Access-Control-Allow-Credentials', 'true')

  return response
}

export function handleCorsPreFlight(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 })
    return cors(request, response)
  }
  return null
}
