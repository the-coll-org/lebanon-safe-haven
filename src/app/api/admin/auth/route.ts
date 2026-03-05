import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSession } from "@/lib/auth";
import { createLog } from "@/lib/logging";

export async function DELETE(request: NextRequest) {
  // Get current Clerk session
  const { userId } = await auth();

  if (userId) {
    // Get user details for logging
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
        details: "User logged out via Clerk",
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      });
    }
  }

  // Clerk handles session clearing on the client side
  // We just return success here
  return NextResponse.json({ success: true });
}
