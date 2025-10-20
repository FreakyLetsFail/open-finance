import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1)

    const isHealthy = !error

    return NextResponse.json(
      {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        database: isHealthy ? 'connected' : 'disconnected',
        version: process.env.npm_package_version || '0.1.0'
      },
      { status: isHealthy ? 200 : 503 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      },
      { status: 503 }
    )
  }
}
