/**
 * Database Layer: Task Activity
 *
 * This is the ONLY file that directly accesses the taskActivity table using ctx.db.
 * All task activity-related database operations are defined here as pure async functions.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type TaskActivityAction =
  | "created"
  | "updated"
  | "completed"
  | "deleted"
  | "status_changed"
  | "priority_changed";

export interface CreateTaskActivityArgs {
  taskId: Id<"tasks">;
  userId: string;
  action: TaskActivityAction;
  changes?: any;
}

// ========================================
// CREATE
// ========================================

/**
 * Create a new task activity record
 */
export async function createTaskActivity(
  ctx: MutationCtx,
  args: CreateTaskActivityArgs
) {
  return await ctx.db.insert("taskActivity", {
    taskId: args.taskId,
    userId: args.userId,
    action: args.action,
    changes: args.changes,
    createdAt: Date.now(),
  });
}

// ========================================
// READ
// ========================================

/**
 * Get activity by ID
 */
export async function getTaskActivityById(
  ctx: QueryCtx,
  id: Id<"taskActivity">
) {
  return await ctx.db.get(id);
}

/**
 * Get all activity for a task
 */
export async function getTaskActivityByTask(
  ctx: QueryCtx,
  taskId: Id<"tasks">
) {
  return await ctx.db
    .query("taskActivity")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .order("desc")
    .collect();
}

/**
 * Get all activity by a user
 */
export async function getTaskActivityByUser(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("taskActivity")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

/**
 * Get activity for a task with time ordering
 */
export async function getTaskActivityByTaskAndTime(
  ctx: QueryCtx,
  taskId: Id<"tasks">,
  limit?: number
) {
  const query = ctx.db
    .query("taskActivity")
    .withIndex("by_task_and_created", (q) => q.eq("taskId", taskId))
    .order("desc");

  if (limit) {
    return await query.take(limit);
  }

  return await query.collect();
}

/**
 * Get recent activity for a user
 */
export async function getRecentActivityByUser(
  ctx: QueryCtx,
  userId: string,
  limit: number = 20
) {
  return await ctx.db
    .query("taskActivity")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .take(limit);
}

// ========================================
// DELETE
// ========================================

/**
 * Delete a task activity record
 */
export async function deleteTaskActivity(
  ctx: MutationCtx,
  id: Id<"taskActivity">
) {
  return await ctx.db.delete(id);
}

/**
 * Delete all activity for a task
 */
export async function deleteTaskActivityByTask(
  ctx: MutationCtx,
  taskId: Id<"tasks">
) {
  const activities = await getTaskActivityByTask(ctx, taskId);
  await Promise.all(activities.map((activity) => ctx.db.delete(activity._id)));
  return activities.length;
}
