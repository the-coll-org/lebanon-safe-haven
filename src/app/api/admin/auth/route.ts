import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createLog } from "@/lib/logging";

export async function DELETE(request: NextRequest) {
  const session = await getSession();

  if (session) {
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

  return NextResponse.json({ success: true });
}
