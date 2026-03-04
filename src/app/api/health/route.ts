import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { cachedJsonResponse, CACHE_DURATIONS } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check database connectivity using PostgreSQL
    const result = await db.execute(sql`SELECT 1 as check`);
    
    if (!result || result.rows.length === 0) {
      throw new Error('Database health check failed');
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '0.1.0',
      checks: {
        database: 'ok'
      }
    };

    return cachedJsonResponse(healthData, CACHE_DURATIONS.HEALTH, { private: true });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Don't cache error responses
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
