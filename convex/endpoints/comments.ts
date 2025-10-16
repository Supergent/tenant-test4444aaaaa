/**
 * Endpoint Layer: Task Comments
 *
 * Business logic for task comments.
 * Composes database operations from the db layer.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";
import { rateLimiter } from "../rateLimiter";
import * as TaskComments from "../db/taskComments";
import * as Tasks from "../db/tasks";
import { isValidCommentContent } from "../helpers/validation";

// ========================================
// QUERIES
// ========================================

/**
 * List all comments for a task
 */
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Verify user owns the task
    const task = await Tasks.getTaskById(ctx, args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== authUser._id) {
      throw new Error("Not authorized to view comments for this task");
    }

    return await TaskComments.getTaskCommentsByTask(ctx, args.taskId);
  },
});

/**
 * Get a single comment by ID
 */
export const get = query({
  args: {
    id: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const comment = await TaskComments.getTaskCommentById(ctx, args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Verify ownership
    if (comment.userId !== authUser._id) {
      throw new Error("Not authorized to view this comment");
    }

    return comment;
  },
});

// ========================================
// MUTATIONS
// ========================================

/**
 * Create a new comment
 */
export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "createComment", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify user owns the task
    const task = await Tasks.getTaskById(ctx, args.taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== authUser._id) {
      throw new Error("Not authorized to comment on this task");
    }

    // Validation
    if (!isValidCommentContent(args.content)) {
      throw new Error("Comment content must be between 1 and 1000 characters");
    }

    // Create comment
    const commentId = await TaskComments.createTaskComment(ctx, {
      taskId: args.taskId,
      userId: authUser._id,
      content: args.content,
    });

    return commentId;
  },
});

/**
 * Update a comment
 */
export const update = mutation({
  args: {
    id: v.id("taskComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "updateComment", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify ownership
    const comment = await TaskComments.getTaskCommentById(ctx, args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.userId !== authUser._id) {
      throw new Error("Not authorized to update this comment");
    }

    // Validation
    if (!isValidCommentContent(args.content)) {
      throw new Error("Comment content must be between 1 and 1000 characters");
    }

    // Update comment
    await TaskComments.updateTaskComment(ctx, args.id, {
      content: args.content,
    });

    return args.id;
  },
});

/**
 * Delete a comment
 */
export const remove = mutation({
  args: {
    id: v.id("taskComments"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "deleteComment", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify ownership
    const comment = await TaskComments.getTaskCommentById(ctx, args.id);
    if (!comment) {
      throw new Error("Comment not found");
    }
    if (comment.userId !== authUser._id) {
      throw new Error("Not authorized to delete this comment");
    }

    // Delete comment
    await TaskComments.deleteTaskComment(ctx, args.id);

    return { success: true };
  },
});
