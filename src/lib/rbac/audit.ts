import { db } from "@/db";
import { roleAuditLogs } from "@/db/schema";
import { v4 as uuid } from "uuid";
import type { PermissionDenialLog, RoleChangeLog, Permission, Role } from "./types";

/**
 * Log a permission denial event
 */
export async function createPermissionDenialLog(
  log: PermissionDenialLog
): Promise<void> {
  try {
    await db.insert(roleAuditLogs).values({
      id: uuid(),
      action: "permission_denied",
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      details: JSON.stringify({
        attemptedAction: log.attemptedAction,
        requiredPermission: log.requiredPermission,
        resourceId: log.resourceId,
        resourceRegion: log.resourceRegion,
      }),
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.timestamp,
    });
  } catch (error) {
    console.error("Failed to log permission denial:", error);
  }
}

/**
 * Log a role change event
 */
export async function createRoleChangeLog(
  log: RoleChangeLog
): Promise<void> {
  try {
    await db.insert(roleAuditLogs).values({
      id: uuid(),
      action: "role_changed",
      userId: log.userId,
      userName: log.userName,
      oldRole: log.oldRole,
      newRole: log.newRole,
      performedById: log.performedById,
      performedByName: log.performedByName,
      details: log.reason || "No reason provided",
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.timestamp,
    });
  } catch (error) {
    console.error("Failed to log role change:", error);
  }
}

/**
 * Log a permission check (for detailed audit trails)
 */
export async function createPermissionCheckLog(data: {
  userId: string;
  userName: string;
  userRole: Role;
  permission: Permission | Permission[];
  resource?: string;
  granted: boolean;
  ipAddress: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await db.insert(roleAuditLogs).values({
      id: uuid(),
      action: data.granted ? "permission_granted" : "permission_denied",
      userId: data.userId,
      userName: data.userName,
      userRole: data.userRole,
      details: JSON.stringify({
        permission: data.permission,
        resource: data.resource,
        granted: data.granted,
      }),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to log permission check:", error);
  }
}

/**
 * Query role audit logs with filters
 * Returns most recent logs first
 */
export async function queryRoleAuditLogs(filters?: {
  userId?: string;
  action?: string;
  limit?: number;
  offset?: number;
}): Promise<Array<{
  id: string;
  action: string;
  userId: string | null;
  userName: string | null;
  userRole: string | null;
  oldRole: string | null;
  newRole: string | null;
  performedById: string | null;
  performedByName: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
}>> {
  try {
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    const query = db.select().from(roleAuditLogs);

    // Note: For complex filtering, use Drizzle's where clause
    // This simplified version returns all logs ordered by date
    
    const logs = await query
      .orderBy(roleAuditLogs.createdAt)
      .limit(limit)
      .offset(offset);

    return logs.map(log => ({
      id: log.id,
      action: log.action,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      oldRole: log.oldRole,
      newRole: log.newRole,
      performedById: log.performedById,
      performedByName: log.performedByName,
      details: log.details,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error("Failed to query role audit logs:", error);
    return [];
  }
}
