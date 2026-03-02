import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, createSession, clearSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

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
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  }

  await createSession(municipality.id);

  return NextResponse.json({
    id: municipality.id,
    name: municipality.name,
    region: municipality.region,
  });
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ success: true });
}
