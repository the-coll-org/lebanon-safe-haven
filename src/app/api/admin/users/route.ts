import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { municipalities } from "@/db/schema";
import { createLog } from "@/lib/logging";
import { withAuth } from "@/lib/rbac/wrapper";
import { canManageRole } from "@/lib/rbac/constants";
import type { Role } from "@/lib/rbac/types";
import { createRoleChangeLog } from "@/lib/rbac/audit";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import crypto from "crypto";
import { eq } from "drizzle-orm";

/**
 * POST /api/admin/users
 * Create a new user (superadmin only)
 * 
 * Using the new RBAC wrapper - authorization is handled automatically:
 * - CSRF validation
 * - Authentication check
 * - Role-based authorization (superadmin only)
 * - Audit logging on denial
 */
export const POST = withAuth(
  {
    roles: "superadmin", // Only superadmin can create users
    csrf: true,
    logDenials: true,
  },
  async (request, { session }) => {
    const body = await request.json();
    const { username, name, region, role, assignedRegions } = body;

    // Validate required fields
    if (!username || !name || !region) {
      return NextResponse.json(
        { error: "Username, name, and region are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (role) {
      const validRoles: Role[] = [
        "superadmin",
        "regional_admin",
        "municipality",
        "moderator",
        "viewer",
      ];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }

      // Validate that the current user can manage this role
      if (!canManageRole(session.role, role as Role)) {
        return NextResponse.json(
          { error: "You cannot create users with a role higher than or equal to your own" },
          { status: 403 }
        );
      }
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        {
          error:
            "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens",
        },
        { status: 400 }
      );
    }

    // Validate assignedRegions for regional_admin
    const targetRole = (role as Role) || "municipality";
    if (targetRole === "regional_admin" && (!assignedRegions || assignedRegions.length === 0)) {
      return NextResponse.json(
        { error: "regional_admin users must have at least one assigned region" },
        { status: 400 }
      );
    }

    try {
      // Generate secure random password
      const password = crypto.randomBytes(16).toString("base64url");
      const passwordHash = await bcrypt.hash(password, 10);

      const userId = uuid();

      await db.insert(municipalities).values({
        id: userId,
        name,
        region,
        role: targetRole,
        username,
        passwordHash,
        assignedRegions: targetRole === "regional_admin" ? assignedRegions : null,
        createdAt: new Date(),
      });

      // Log user creation
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ipAddress = forwardedFor
        ? forwardedFor.split(",")[0].trim()
        : "127.0.0.1";

      await createLog({
        action: "create",
        entityType: "user",
        entityId: userId,
        userId: session.id,
        userName: session.name,
        details: `Created new ${targetRole} user "${username}" for ${region}${
          assignedRegions ? ` with regions: ${assignedRegions.join(", ")}` : ""
        }`,
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      });

      // Log role assignment
      await createRoleChangeLog({
        userId: userId,
        userName: name,
        oldRole: "municipality", // Default role
        newRole: targetRole,
        performedById: session.id,
        performedByName: session.name,
        reason: "User creation",
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
        timestamp: new Date(),
      });

      return NextResponse.json({
        success: true,
        username,
        password,
        message:
          "User created successfully. Save the password - it cannot be recovered!",
      });
    } catch (error) {
      // Check for unique constraint violation
      if (
        error instanceof Error &&
        (error.message.includes("unique constraint") ||
          error.message.includes("duplicate key"))
      ) {
        return NextResponse.json(
          { error: `Username "${username}" already exists` },
          { status: 409 }
        );
      }

      console.error("Error creating user:", error);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }
  }
);

/**
 * GET /api/admin/users
 * List all users (superadmin only)
 */
export const GET = withAuth(
  {
    roles: "superadmin",
    logDenials: true,
  },
  async (_request, { session }) => {
    try {
      const users = await db.query.municipalities.findMany({
        columns: {
          id: true,
          name: true,
          username: true,
          region: true,
          role: true,
          assignedRegions: true,
          createdAt: true,
        },
        orderBy: (municipalities, { desc }) => [desc(municipalities.createdAt)],
      });

      return NextResponse.json({ users });
    } catch (error) {
      console.error("Error fetching users:", error);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }
  }
);
