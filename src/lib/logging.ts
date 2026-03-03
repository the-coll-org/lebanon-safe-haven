import { db } from "@/db";
import { adminLogs } from "@/db/schema";
import { v4 as uuid } from "uuid";

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
    // Silently fail - don't break the main operation if logging fails
    console.error("Failed to create admin log:", error);
  }
}

export type LogAction = 
  | "login" 
  | "logout" 
  | "create" 
  | "update" 
  | "delete" 
  | "verify" 
  | "unflag" 
  | "bulk_delete";

export type LogEntity = 
  | "listing" 
  | "user" 
  | "flag" 
  | "feedback" 
  | "auth";
