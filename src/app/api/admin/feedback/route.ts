import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback, municipalities } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { withAuth } from "@/lib/rbac/wrapper";

/**
 * GET /api/admin/feedback
 * Get all feedback (admin only)
 */
export const GET = withAuth(
  {
    permissions: "feedback:read",
    logDenials: true,
  },
  async (request) => {
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
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(feedback);

    const total = countResult[0]?.count ?? 0;

    return NextResponse.json({
      feedback: results,
      total,
      limit,
      offset,
    });
  }
);
