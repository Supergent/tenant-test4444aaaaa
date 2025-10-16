/**
 * Database Layer: Task Comments
 *
 * This is the ONLY file that directly accesses the taskComments table using ctx.db.
 * All task comment-related database operations are defined here as pure async functions.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface CreateTaskCommentArgs {
  taskId: Id<"tasks">;
  userId: string;
  content: string;
}

export interface UpdateTaskCommentArgs {
  content: string;
}

// ========================================
// CREATE
// ========================================

/**
 * Create a new task comment
 */
export async function createTaskComment(
  ctx: MutationCtx,
  args: CreateTaskCommentArgs
) {
  const now = Date.now();
  return await ctx.db.insert("taskComments", {
    taskId: args.taskId,
    userId: args.userId,
    content: args.content,
    createdAt: now,
    updatedAt: now,
  });
}

// ========================================
// READ
// ========================================

/**
 * Get comment by ID
 */
export async function getTaskCommentById(
  ctx: QueryCtx,
  id: Id<"taskComments">
) {
  return await ctx.db.get(id);
}

/**
 * Get all comments for a task
 */
export async function getTaskCommentsByTask(
  ctx: QueryCtx,
  taskId: Id<"tasks">
) {
  return await ctx.db
    .query("taskComments")
    .withIndex("by_task", (q) => q.eq("taskId", taskId))
    .order("desc")
    .collect();
}

/**
 * Get all comments by a user
 */
export async function getTaskCommentsByUser(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("taskComments")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

/**
 * Get comment count for a task
 */
export async function getTaskCommentCount(ctx: QueryCtx, taskId: Id<"tasks">) {
  const comments = await getTaskCommentsByTask(ctx, taskId);
  return comments.length;
}

// ========================================
// UPDATE
// ========================================

/**
 * Update a task comment
 */
export async function updateTaskComment(
  ctx: MutationCtx,
  id: Id<"taskComments">,
  args: UpdateTaskCommentArgs
) {
  return await ctx.db.patch(id, {
    content: args.content,
    updatedAt: Date.now(),
  });
}

// ========================================
// DELETE
// ========================================

/**
 * Delete a task comment
 */
export async function deleteTaskComment(
  ctx: MutationCtx,
  id: Id<"taskComments">
) {
  return await ctx.db.delete(id);
}

/**
 * Delete all comments for a task
 */
export async function deleteTaskCommentsByTask(
  ctx: MutationCtx,
  taskId: Id<"tasks">
) {
  const comments = await getTaskCommentsByTask(ctx, taskId);
  await Promise.all(comments.map((comment) => ctx.db.delete(comment._id)));
  return comments.length;
}
