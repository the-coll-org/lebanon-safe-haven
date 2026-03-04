import { NextResponse } from "next/server";
import { withAuth } from "@/lib/rbac/wrapper";

/**
 * GET /api/admin/me
 * Get current user info
 */
export const GET = withAuth(
  {},
  async (_request, { session }) => {
    return NextResponse.json({
      id: session.id,
      name: session.name,
      region: session.region,
      role: session.role,
      username: session.username,
      assignedRegions: session.assignedRegions,
    });
  }
);
