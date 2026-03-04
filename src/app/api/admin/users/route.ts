import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { db } from "@/db";
import { municipalities } from "@/db/schema";
import { createLog } from "@/lib/logging";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only superadmins can create new users
  if (session.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - only superadmins can create users" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { username, name, region, role } = body;

  if (!username || !name || !region) {
    return NextResponse.json(
      { error: "Username, name, and region are required" },
      { status: 400 }
    );
  }

  // Validate role
  if (role && role !== "municipality" && role !== "superadmin") {
    return NextResponse.json(
      { error: "Invalid role. Must be 'municipality' or 'superadmin'" },
      { status: 400 }
    );
  }

  // Validate username format (alphanumeric, underscore, hyphen, 3-30 chars)
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens" },
      { status: 400 }
    );
  }

  try {
    // Generate secure random password
    const password = crypto.randomBytes(16).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(municipalities).values({
      id: uuid(),
      name,
      region,
      role: role || "municipality",
      username,
      passwordHash,
      createdAt: new Date(),
    });

    // Log user creation
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    await createLog({
      action: "create",
      entityType: "user",
      entityId: uuid(),
      userId: session.id,
      userName: session.name,
      details: `Created new ${role || "municipality"} user "${username}" for ${region}`,
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({
      success: true,
      username,
      password,
      message: "User created successfully. Save the password - it cannot be recovered!",
    });
  } catch (error) {
    // Check for unique constraint violation
    if (error instanceof Error && 
        (error.message.includes("unique constraint") || error.message.includes("duplicate key"))) {
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

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only superadmins can list all users
  if (session.role !== "superadmin") {
    return NextResponse.json(
      { error: "Forbidden - only superadmins can view users" },
      { status: 403 }
    );
  }

  try {
    const users = await db.query.municipalities.findMany({
      columns: {
        id: true,
        name: true,
        username: true,
        region: true,
        role: true,
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
