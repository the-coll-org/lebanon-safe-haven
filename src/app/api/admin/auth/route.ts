import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, createSession, clearSession, getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { createLog } from "@/lib/logging";

/**
 * POST /api/admin/auth
 * Login endpoint (no RBAC - this IS the auth)
 */
export async function POST(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  // 5 attempts per 15 minutes per IP
  const limited = rateLimit(request, {
    name: "admin-login",
    windowMs: 15 * 60 * 1000,
    max: 5,
  });
  if (limited) return limited;

  const body = await request.json();
  const { username, password } = body;

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username and password are required" },
      { status: 400 }
    );
  }

  const municipality = await authenticateAdmin(username, password);

  if (!municipality) {
    // Log failed login attempt
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    await createLog({
      action: "login",
      entityType: "auth",
      userName: username,
      details: "Failed login attempt",
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  await createSession(municipality.id);

  // Log successful login
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  await createLog({
    action: "login",
    entityType: "auth",
    userId: municipality.id,
    userName: municipality.name,
    details: "Successful login",
    ipAddress,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return NextResponse.json({
    id: municipality.id,
    name: municipality.name,
    region: municipality.region,
    role: municipality.role,
  });
}

/**
 * DELETE /api/admin/auth
 * Logout endpoint (no RBAC required - just clears session)
 */
export async function DELETE(request: NextRequest) {
  // Get current session before clearing it
  const session = await getSession();

  if (session) {
    // Log logout
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    await createLog({
      action: "logout",
      entityType: "auth",
      userId: session.id,
      userName: session.name,
      details: "User logged out",
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });
  }

  await clearSession();
  return NextResponse.json({ success: true });
}
