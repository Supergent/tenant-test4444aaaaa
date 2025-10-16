/**
 * Database Layer: Tasks
 *
 * This is the ONLY file that directly accesses the tasks table using ctx.db.
 * All task-related database operations are defined here as pure async functions.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskPriority = "low" | "medium" | "high";

export interface CreateTaskArgs {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: number;
  position: number;
  tags?: string[];
}

export interface UpdateTaskArgs {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: number;
  completedAt?: number;
  position?: number;
  tags?: string[];
}

// ========================================
// CREATE
// ========================================

/**
 * Create a new task
 */
export async function createTask(ctx: MutationCtx, args: CreateTaskArgs) {
  const now = Date.now();
  return await ctx.db.insert("tasks", {
    userId: args.userId,
    title: args.title,
    description: args.description,
    status: args.status ?? "pending",
    priority: args.priority ?? "medium",
    dueDate: args.dueDate,
    position: args.position,
    tags: args.tags,
    createdAt: now,
    updatedAt: now,
  });
}

// ========================================
// READ
// ========================================

/**
 * Get task by ID
 */
export async function getTaskById(ctx: QueryCtx, id: Id<"tasks">) {
  return await ctx.db.get(id);
}

/**
 * Get all tasks for a user
 */
export async function getTasksByUser(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("tasks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

/**
 * Get tasks by user and status
 */
export async function getTasksByUserAndStatus(
  ctx: QueryCtx,
  userId: string,
  status: TaskStatus
) {
  return await ctx.db
    .query("tasks")
    .withIndex("by_user_and_status", (q) =>
      q.eq("userId", userId).eq("status", status)
    )
    .order("desc")
    .collect();
}

/**
 * Get tasks by user ordered by position (for drag-and-drop)
 */
export async function getTasksByUserAndPosition(
  ctx: QueryCtx,
  userId: string
) {
  return await ctx.db
    .query("tasks")
    .withIndex("by_user_and_position", (q) => q.eq("userId", userId))
    .collect();
}

/**
 * Get tasks with upcoming due dates
 */
export async function getTasksByDueDate(
  ctx: QueryCtx,
  maxDueDate?: number
) {
  const query = ctx.db.query("tasks").withIndex("by_due_date");

  if (maxDueDate) {
    return await query
      .filter((q) =>
        q.and(
          q.neq(q.field("dueDate"), undefined),
          q.lte(q.field("dueDate"), maxDueDate)
        )
      )
      .collect();
  }

  return await query
    .filter((q) => q.neq(q.field("dueDate"), undefined))
    .collect();
}

/**
 * Get overdue tasks for a user
 */
export async function getOverdueTasksByUser(
  ctx: QueryCtx,
  userId: string,
  currentTime: number
) {
  const allTasks = await getTasksByUser(ctx, userId);
  return allTasks.filter(
    (task) =>
      task.dueDate &&
      task.dueDate < currentTime &&
      task.status !== "completed"
  );
}

/**
 * Get task count by user and status
 */
export async function getTaskCountByUserAndStatus(
  ctx: QueryCtx,
  userId: string,
  status: TaskStatus
) {
  const tasks = await getTasksByUserAndStatus(ctx, userId, status);
  return tasks.length;
}

/**
 * Get highest position for user (for adding new tasks at the end)
 */
export async function getMaxPositionForUser(
  ctx: QueryCtx,
  userId: string
): Promise<number> {
  const tasks = await getTasksByUser(ctx, userId);
  if (tasks.length === 0) return 0;
  return Math.max(...tasks.map((t) => t.position));
}

// ========================================
// UPDATE
// ========================================

/**
 * Update a task
 */
export async function updateTask(
  ctx: MutationCtx,
  id: Id<"tasks">,
  args: UpdateTaskArgs
) {
  return await ctx.db.patch(id, {
    ...args,
    updatedAt: Date.now(),
  });
}

/**
 * Mark task as completed
 */
export async function completeTask(ctx: MutationCtx, id: Id<"tasks">) {
  return await ctx.db.patch(id, {
    status: "completed",
    completedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/**
 * Update task position (for reordering)
 */
export async function updateTaskPosition(
  ctx: MutationCtx,
  id: Id<"tasks">,
  newPosition: number
) {
  return await ctx.db.patch(id, {
    position: newPosition,
    updatedAt: Date.now(),
  });
}

/**
 * Batch update task positions (for drag-and-drop reordering)
 */
export async function batchUpdateTaskPositions(
  ctx: MutationCtx,
  updates: Array<{ id: Id<"tasks">; position: number }>
) {
  const now = Date.now();
  await Promise.all(
    updates.map((update) =>
      ctx.db.patch(update.id, {
        position: update.position,
        updatedAt: now,
      })
    )
  );
}

// ========================================
// DELETE
// ========================================

/**
 * Delete a task
 */
export async function deleteTask(ctx: MutationCtx, id: Id<"tasks">) {
  return await ctx.db.delete(id);
}

/**
 * Delete all completed tasks for a user
 */
export async function deleteCompletedTasksByUser(
  ctx: MutationCtx,
  userId: string
) {
  const completedTasks = await getTasksByUserAndStatus(ctx, userId, "completed");
  await Promise.all(completedTasks.map((task) => ctx.db.delete(task._id)));
  return completedTasks.length;
}
