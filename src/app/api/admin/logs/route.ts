import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { adminLogs } from "@/db/schema";
import { desc, count } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only superadmins can view logs
  if (session.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - only superadmins can view logs" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50") || 50, 1), 200);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0") || 0, 0);

    const logs = await db.query.adminLogs.findMany({
      limit,
      offset,
      orderBy: [desc(adminLogs.createdAt)],
    });

    const totalResult = await db.select({ count: count() }).from(adminLogs);
    const total = Number(totalResult[0]?.count || 0);

    return NextResponse.json({ logs, total, limit, offset });
  } catch (error) {
    console.error("Error fetching logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

// No POST endpoint — all logging happens server-side via createLog() in src/lib/logging.ts
