import { NextRequest, NextResponse } from "next/server";

/**
 * Validates that state-changing requests originate from our own site.
 * Checks the Origin header against the request's host.
 * Returns null if valid, or a 403 Response if rejected.
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");

  // If no origin header (e.g. same-origin non-CORS), allow
  if (!origin) return null;

  try {
    const originHost = new URL(origin).host;
    const requestHost = request.nextUrl.host;

    if (originHost === requestHost) return null;
  } catch {
    // Malformed origin
  }

  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403 }
  );
}
