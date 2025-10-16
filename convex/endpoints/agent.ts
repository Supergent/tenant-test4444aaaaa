/**
 * Endpoint Layer: AI Agent
 *
 * Business logic for AI assistant interactions.
 * Manages threads and messages for AI conversations.
 */

import { v } from "convex/values";
import { mutation, query, action } from "../_generated/server";
import { authComponent } from "../auth";
import { rateLimiter } from "../rateLimiter";
import * as Threads from "../db/threads";
import * as Messages from "../db/messages";
import { isValidMessageContent, isValidThreadTitle } from "../helpers/validation";

// ========================================
// THREAD QUERIES
// ========================================

/**
 * List all threads for the user
 */
export const listThreads = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await Threads.getThreadsByUserOrderedByLastMessage(ctx, authUser._id);
  },
});

/**
 * List active threads
 */
export const listActiveThreads = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await Threads.getActiveThreadsByUser(ctx, authUser._id);
  },
});

/**
 * Get a single thread
 */
export const getThread = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }

    // Verify ownership
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to view this thread");
    }

    return thread;
  },
});

// ========================================
// MESSAGE QUERIES
// ========================================

/**
 * List all messages in a thread
 */
export const listMessages = query({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the thread
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to view messages in this thread");
    }

    return await Messages.getMessagesByThreadOrdered(ctx, args.threadId);
  },
});

/**
 * List recent messages in a thread
 */
export const listRecentMessages = query({
  args: {
    threadId: v.id("threads"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the thread
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to view messages in this thread");
    }

    return await Messages.getRecentMessagesByThread(
      ctx,
      args.threadId,
      args.limit ?? 50
    );
  },
});

// ========================================
// THREAD MUTATIONS
// ========================================

/**
 * Create a new thread
 */
export const createThread = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "createThread", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Validation
    if (args.title && !isValidThreadTitle(args.title)) {
      throw new Error("Thread title must be max 100 characters");
    }

    // Create thread
    const threadId = await Threads.createThread(ctx, {
      userId: authUser._id,
      title: args.title,
    });

    return threadId;
  },
});

/**
 * Update thread
 */
export const updateThread = mutation({
  args: {
    threadId: v.id("threads"),
    title: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("archived"))),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify ownership
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to update this thread");
    }

    // Validation
    if (args.title && !isValidThreadTitle(args.title)) {
      throw new Error("Thread title must be max 100 characters");
    }

    // Update thread
    const { threadId, ...updateArgs } = args;
    await Threads.updateThread(ctx, threadId, updateArgs);

    return threadId;
  },
});

/**
 * Archive a thread
 */
export const archiveThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify ownership
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to archive this thread");
    }

    // Archive thread
    await Threads.archiveThread(ctx, args.threadId);

    return { success: true };
  },
});

/**
 * Delete a thread
 */
export const deleteThread = mutation({
  args: {
    threadId: v.id("threads"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify ownership
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to delete this thread");
    }

    // Delete all messages in thread
    await Messages.deleteMessagesByThread(ctx, args.threadId);

    // Delete thread
    await Threads.deleteThread(ctx, args.threadId);

    return { success: true };
  },
});

// ========================================
// MESSAGE MUTATIONS
// ========================================

/**
 * Send a message (user message)
 */
export const sendMessage = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "sendMessage", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify user owns the thread
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized to send messages in this thread");
    }

    // Validation
    if (!isValidMessageContent(args.content)) {
      throw new Error("Message content must be between 1 and 10000 characters");
    }

    // Create user message
    const messageId = await Messages.createMessage(ctx, {
      threadId: args.threadId,
      userId: authUser._id,
      role: "user",
      content: args.content,
    });

    // Update thread's last message timestamp
    await Threads.updateThreadLastMessage(ctx, args.threadId, Date.now());

    return messageId;
  },
});

/**
 * Store AI response (called by AI action)
 */
export const storeAssistantMessage = mutation({
  args: {
    threadId: v.id("threads"),
    content: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the thread
    const thread = await Threads.getThreadById(ctx, args.threadId);
    if (!thread) {
      throw new Error("Thread not found");
    }
    if (thread.userId !== authUser._id) {
      throw new Error("Not authorized");
    }

    // Create assistant message
    const messageId = await Messages.createMessage(ctx, {
      threadId: args.threadId,
      userId: authUser._id,
      role: "assistant",
      content: args.content,
      metadata: args.metadata,
    });

    // Update thread's last message timestamp
    await Threads.updateThreadLastMessage(ctx, args.threadId, Date.now());

    return messageId;
  },
});

// ========================================
// AI ACTIONS
// ========================================

/**
 * Send message and get AI response
 *
 * This is a placeholder action that demonstrates the pattern.
 * In production, this would call an AI service (OpenAI, Anthropic, etc.)
 */
export const chat = action({
  args: {
    threadId: v.id("threads"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Send user message
    const messageId = await ctx.runMutation(
      (ctx as any).api.endpoints.agent.sendMessage,
      {
        threadId: args.threadId,
        content: args.message,
      }
    );

    // 2. Get conversation history
    const messages = await ctx.runQuery(
      (ctx as any).api.endpoints.agent.listMessages,
      {
        threadId: args.threadId,
      }
    );

    // 3. TODO: Call AI service here
    // For now, return a placeholder response
    const aiResponse = `I received your message: "${args.message}". (AI integration pending - add OpenAI/Anthropic API call here)`;

    // 4. Store AI response
    const assistantMessageId = await ctx.runMutation(
      (ctx as any).api.endpoints.agent.storeAssistantMessage,
      {
        threadId: args.threadId,
        content: aiResponse,
        metadata: {
          model: "placeholder",
          tokens: 0,
        },
      }
    );

    return {
      userMessageId: messageId,
      assistantMessageId,
      response: aiResponse,
    };
  },
});
