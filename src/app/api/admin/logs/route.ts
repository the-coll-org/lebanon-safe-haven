import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { adminLogs } from "@/db/schema";
import { v4 as uuid } from "uuid";
import { desc, count } from "drizzle-orm";

export interface LogData {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createLog(logData: LogData) {
  try {
    await db.insert(adminLogs).values({
      id: uuid(),
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId || null,
      userId: logData.userId || null,
      userName: logData.userName || null,
      details: logData.details || null,
      ipAddress: logData.ipAddress || null,
      userAgent: logData.userAgent || null,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to create log:", error);
  }
}

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
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

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

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, entityType, entityId, details } = body;

    if (!action || !entityType) {
      return NextResponse.json(
        { error: "Action and entityType are required" },
        { status: 400 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || undefined;

    await createLog({
      action,
      entityType,
      entityId,
      userId: session.id,
      userName: session.name,
      details,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating log:", error);
    return NextResponse.json(
      { error: "Failed to create log" },
      { status: 500 }
    );
  }
}
