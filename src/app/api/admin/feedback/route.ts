import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback, municipalities } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Only authenticated admins can view feedback
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = request.nextUrl;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Fetch feedback with municipality info for authenticated users
  const results = await db
    .select({
      id: feedback.id,
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
      category: feedback.category,
      userType: feedback.userType,
      municipalityName: municipalities.name,
      createdAt: feedback.createdAt,
    })
    .from(feedback)
    .leftJoin(municipalities, eq(feedback.municipalityId, municipalities.id))
    .orderBy(desc(feedback.createdAt))
    .limit(limit)
    .offset(offset)
    .all();

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(feedback)
    .get();

  const total = countResult?.count ?? 0;

  return NextResponse.json({
    feedback: results,
    total,
    limit,
    offset,
  });
}