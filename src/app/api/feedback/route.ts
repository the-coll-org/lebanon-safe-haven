import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { v4 as uuid } from "uuid";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { getSession } from "@/lib/auth";

const FEEDBACK_CATEGORIES = ["general", "bug", "feature", "complaint", "other"] as const;

export async function POST(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  // Rate limit: 5 feedback submissions per hour per IP
  const limited = rateLimit(request, {
    name: "submit-feedback",
    windowMs: 60 * 60 * 1000,
    max: 5,
  });
  if (limited) return limited;

  const body = await request.json();
  const { name, email, message, category } = body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  const trimmedMessage = message.trim();
  if (trimmedMessage.length < 10 || trimmedMessage.length > 2000) {
    return NextResponse.json(
      { error: "Message must be between 10 and 2000 characters" },
      { status: 400 }
    );
  }

  const validCategory = category && FEEDBACK_CATEGORIES.includes(category) 
    ? category 
    : "general";

  // Check if user is authenticated (municipality admin)
  const session = await getSession();
  const municipalityId = session?.id || null;
  const userType = session ? "authenticated" : "guest";

  const id = uuid();
  const now = new Date().toISOString();

  db.insert(feedback).values({
    id,
    name: name ? String(name).slice(0, 100).trim() : null,
    email: email ? String(email).slice(0, 255).trim() : null,
    message: trimmedMessage,
    category: validCategory,
    userType,
    municipalityId,
    createdAt: now,
  }).run();

  return NextResponse.json({ 
    success: true, 
    message: "Feedback submitted successfully",
    id 
  }, { status: 201 });
}