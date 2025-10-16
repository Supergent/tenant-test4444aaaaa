/**
 * Database Layer: Messages (AI Agent)
 *
 * This is the ONLY file that directly accesses the messages table using ctx.db.
 * All message-related database operations are defined here as pure async functions.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type MessageRole = "user" | "assistant" | "system";

export interface CreateMessageArgs {
  threadId: Id<"threads">;
  userId: string;
  role: MessageRole;
  content: string;
  metadata?: any;
}

// ========================================
// CREATE
// ========================================

/**
 * Create a new message
 */
export async function createMessage(
  ctx: MutationCtx,
  args: CreateMessageArgs
) {
  return await ctx.db.insert("messages", {
    threadId: args.threadId,
    userId: args.userId,
    role: args.role,
    content: args.content,
    metadata: args.metadata,
    createdAt: Date.now(),
  });
}

// ========================================
// READ
// ========================================

/**
 * Get message by ID
 */
export async function getMessageById(ctx: QueryCtx, id: Id<"messages">) {
  return await ctx.db.get(id);
}

/**
 * Get all messages for a thread
 */
export async function getMessagesByThread(
  ctx: QueryCtx,
  threadId: Id<"threads">
) {
  return await ctx.db
    .query("messages")
    .withIndex("by_thread", (q) => q.eq("threadId", threadId))
    .collect();
}

/**
 * Get messages for a thread ordered by time
 */
export async function getMessagesByThreadOrdered(
  ctx: QueryCtx,
  threadId: Id<"threads">
) {
  return await ctx.db
    .query("messages")
    .withIndex("by_thread_and_created", (q) => q.eq("threadId", threadId))
    .order("asc")
    .collect();
}

/**
 * Get recent messages for a thread
 */
export async function getRecentMessagesByThread(
  ctx: QueryCtx,
  threadId: Id<"threads">,
  limit: number = 50
) {
  return await ctx.db
    .query("messages")
    .withIndex("by_thread_and_created", (q) => q.eq("threadId", threadId))
    .order("desc")
    .take(limit);
}

/**
 * Get message count for a thread
 */
export async function getMessageCountByThread(
  ctx: QueryCtx,
  threadId: Id<"threads">
) {
  const messages = await getMessagesByThread(ctx, threadId);
  return messages.length;
}

// ========================================
// DELETE
// ========================================

/**
 * Delete a message
 */
export async function deleteMessage(ctx: MutationCtx, id: Id<"messages">) {
  return await ctx.db.delete(id);
}

/**
 * Delete all messages for a thread
 */
export async function deleteMessagesByThread(
  ctx: MutationCtx,
  threadId: Id<"threads">
) {
  const messages = await getMessagesByThread(ctx, threadId);
  await Promise.all(messages.map((message) => ctx.db.delete(message._id)));
  return messages.length;
}
