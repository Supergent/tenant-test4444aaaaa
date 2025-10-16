/**
 * Database Layer: Threads (AI Agent)
 *
 * This is the ONLY file that directly accesses the threads table using ctx.db.
 * All thread-related database operations are defined here as pure async functions.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type ThreadStatus = "active" | "archived";

export interface CreateThreadArgs {
  userId: string;
  title?: string;
  status?: ThreadStatus;
}

export interface UpdateThreadArgs {
  title?: string;
  status?: ThreadStatus;
  lastMessageAt?: number;
}

// ========================================
// CREATE
// ========================================

/**
 * Create a new thread
 */
export async function createThread(ctx: MutationCtx, args: CreateThreadArgs) {
  const now = Date.now();
  return await ctx.db.insert("threads", {
    userId: args.userId,
    title: args.title,
    status: args.status ?? "active",
    createdAt: now,
    updatedAt: now,
  });
}

// ========================================
// READ
// ========================================

/**
 * Get thread by ID
 */
export async function getThreadById(ctx: QueryCtx, id: Id<"threads">) {
  return await ctx.db.get(id);
}

/**
 * Get all threads for a user
 */
export async function getThreadsByUser(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("threads")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

/**
 * Get threads by user and status
 */
export async function getThreadsByUserAndStatus(
  ctx: QueryCtx,
  userId: string,
  status: ThreadStatus
) {
  return await ctx.db
    .query("threads")
    .withIndex("by_user_and_status", (q) =>
      q.eq("userId", userId).eq("status", status)
    )
    .order("desc")
    .collect();
}

/**
 * Get active threads for a user
 */
export async function getActiveThreadsByUser(ctx: QueryCtx, userId: string) {
  return await getThreadsByUserAndStatus(ctx, userId, "active");
}

/**
 * Get threads ordered by last message time
 */
export async function getThreadsByUserOrderedByLastMessage(
  ctx: QueryCtx,
  userId: string
) {
  return await ctx.db
    .query("threads")
    .withIndex("by_user_and_last_message", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

/**
 * Get recent threads for a user
 */
export async function getRecentThreadsByUser(
  ctx: QueryCtx,
  userId: string,
  limit: number = 10
) {
  return await ctx.db
    .query("threads")
    .withIndex("by_user_and_last_message", (q) => q.eq("userId", userId))
    .order("desc")
    .take(limit);
}

// ========================================
// UPDATE
// ========================================

/**
 * Update a thread
 */
export async function updateThread(
  ctx: MutationCtx,
  id: Id<"threads">,
  args: UpdateThreadArgs
) {
  return await ctx.db.patch(id, {
    ...args,
    updatedAt: Date.now(),
  });
}

/**
 * Update thread's last message timestamp
 */
export async function updateThreadLastMessage(
  ctx: MutationCtx,
  id: Id<"threads">,
  lastMessageAt: number
) {
  return await ctx.db.patch(id, {
    lastMessageAt,
    updatedAt: Date.now(),
  });
}

/**
 * Archive a thread
 */
export async function archiveThread(ctx: MutationCtx, id: Id<"threads">) {
  return await ctx.db.patch(id, {
    status: "archived",
    updatedAt: Date.now(),
  });
}

// ========================================
// DELETE
// ========================================

/**
 * Delete a thread
 */
export async function deleteThread(ctx: MutationCtx, id: Id<"threads">) {
  return await ctx.db.delete(id);
}
