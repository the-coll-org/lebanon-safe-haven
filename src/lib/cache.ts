import { NextRequest, NextResponse } from 'next/server';

/**
 * Cache duration configurations (in seconds)
 */
export const CACHE_DURATIONS = {
  // Static data that rarely changes (hotlines, constants)
  STATIC: 86400, // 24 hours
  
  // Listing data - moderate updates expected
  LISTINGS: 60, // 1 minute
  
  // Public listing listings with filters
  LISTINGS_FILTERED: 30, // 30 seconds
  
  // Admin data - more frequent updates
  ADMIN_DATA: 10, // 10 seconds
  
  // Health/version checks - vary by endpoint
  HEALTH: 5, // 5 seconds
  VERSION: 0, // No cache (always fresh)
} as const;

/**
 * Build Cache-Control header value
 */
export function buildCacheControl(
  maxAge: number,
  staleWhileRevalidate?: number,
  options: {
    private?: boolean;
    immutable?: boolean;
    noStore?: boolean;
  } = {}
): string {
  if (options.noStore) {
    return 'no-cache, no-store, must-revalidate';
  }

  const directives: string[] = [];
  
  if (options.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }

  directives.push(`max-age=${maxAge}`);

  if (staleWhileRevalidate && staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${staleWhileRevalidate}`);
  }

  if (options.immutable) {
    directives.push('immutable');
  }

  directives.push('must-revalidate');

  return directives.join(', ');
}

/**
 * Create a cached JSON response
 */
export function cachedJsonResponse(
  data: unknown,
  cacheDuration: number,
  options: {
    staleWhileRevalidate?: number;
    private?: boolean;
  } = {}
): NextResponse {
  const cacheControl = buildCacheControl(
    cacheDuration,
    options.staleWhileRevalidate,
    { private: options.private }
  );

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': cacheControl,
      'CDN-Cache-Control': cacheControl,
      'Vercel-CDN-Cache-Control': cacheControl,
    },
  });
}

/**
 * Generate ETag for data
 */
export function generateETag(data: unknown): string {
  const str = JSON.stringify(data);
  // Simple hash for ETag
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `"${hash.toString(16)}"`;
}

/**
 * Handle conditional requests with ETag
 */
export function handleConditionalRequest(
  request: NextRequest,
  data: unknown,
  cacheDuration: number,
  options: {
    staleWhileRevalidate?: number;
    private?: boolean;
  } = {}
): NextResponse {
  const etag = generateETag(data);
  const ifNoneMatch = request.headers.get('if-none-match');

  // Return 304 Not Modified if ETag matches
  if (ifNoneMatch === etag) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        'Cache-Control': buildCacheControl(cacheDuration, options.staleWhileRevalidate, { private: options.private }),
        'ETag': etag,
      },
    });
  }

  // Return fresh data with ETag
  const cacheControl = buildCacheControl(
    cacheDuration,
    options.staleWhileRevalidate,
    { private: options.private }
  );

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': cacheControl,
      'CDN-Cache-Control': cacheControl,
      'Vercel-CDN-Cache-Control': cacheControl,
      'ETag': etag,
    },
  });
}

/**
 * Check if request should bypass cache (admin actions, mutations)
 */
export function shouldBypassCache(request: NextRequest): boolean {
  // Bypass cache for admin requests
  if (request.url.includes('/api/admin/')) {
    return true;
  }

  // Bypass for authenticated mutations
  const authHeader = request.headers.get('authorization');
  if (authHeader && request.method !== 'GET') {
    return true;
  }

  // Bypass for no-cache header
  const cacheControl = request.headers.get('cache-control');
  if (cacheControl?.includes('no-cache')) {
    return true;
  }

  return false;
}
