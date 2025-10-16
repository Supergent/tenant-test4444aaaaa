/**
 * Endpoint Layer: Tasks
 *
 * Business logic for task management.
 * Composes database operations from the db layer.
 * Handles authentication and authorization.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";
import { rateLimiter } from "../rateLimiter";
import * as Tasks from "../db/tasks";
import * as TaskActivity from "../db/taskActivity";
import { validateTaskInput } from "../helpers/validation";

// ========================================
// QUERIES
// ========================================

/**
 * List all tasks for the authenticated user
 */
export const list = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await Tasks.getTasksByUser(ctx, authUser._id);
  },
});

/**
 * List tasks by status
 */
export const listByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await Tasks.getTasksByUserAndStatus(ctx, authUser._id, args.status);
  },
});

/**
 * Get tasks ordered by position (for drag-and-drop)
 */
export const listByPosition = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await Tasks.getTasksByUserAndPosition(ctx, authUser._id);
  },
});

/**
 * Get a single task by ID
 */
export const get = query({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const task = await Tasks.getTaskById(ctx, args.id);
    if (!task) {
      throw new Error("Task not found");
    }

    // Verify ownership
    if (task.userId !== authUser._id) {
      throw new Error("Not authorized to view this task");
    }

    return task;
  },
});

/**
 * Get overdue tasks
 */
export const listOverdue = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await Tasks.getOverdueTasksByUser(ctx, authUser._id, Date.now());
  },
});

/**
 * Get task statistics
 */
export const getStats = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const [pending, inProgress, completed, overdue] = await Promise.all([
      Tasks.getTaskCountByUserAndStatus(ctx, authUser._id, "pending"),
      Tasks.getTaskCountByUserAndStatus(ctx, authUser._id, "in_progress"),
      Tasks.getTaskCountByUserAndStatus(ctx, authUser._id, "completed"),
      Tasks.getOverdueTasksByUser(ctx, authUser._id, Date.now()),
    ]);

    const total = pending + inProgress + completed;

    return {
      total,
      pending,
      inProgress,
      completed,
      overdue: overdue.length,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },
});

// ========================================
// MUTATIONS
// ========================================

/**
 * Create a new task
 */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "createTask", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Validation
    const validation = validateTaskInput({
      title: args.title,
      description: args.description,
      dueDate: args.dueDate,
      tags: args.tags,
    });

    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    // Get next position
    const maxPosition = await Tasks.getMaxPositionForUser(ctx, authUser._id);

    // Create task
    const taskId = await Tasks.createTask(ctx, {
      userId: authUser._id,
      title: args.title,
      description: args.description,
      priority: args.priority,
      dueDate: args.dueDate,
      tags: args.tags,
      position: maxPosition + 1,
    });

    // Log activity
    await TaskActivity.createTaskActivity(ctx, {
      taskId,
      userId: authUser._id,
      action: "created",
    });

    return taskId;
  },
});

/**
 * Update a task
 */
export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("in_progress"),
        v.literal("completed")
      )
    ),
    priority: v.optional(
      v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
    ),
    dueDate: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "updateTask", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify ownership
    const task = await Tasks.getTaskById(ctx, args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== authUser._id) {
      throw new Error("Not authorized to update this task");
    }

    // Validation
    if (args.title || args.description || args.dueDate || args.tags) {
      const validation = validateTaskInput({
        title: args.title || task.title,
        description: args.description,
        dueDate: args.dueDate,
        tags: args.tags,
      });

      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }
    }

    // Track changes for activity log
    const changes: any = {};
    if (args.status && args.status !== task.status) {
      changes.status = { from: task.status, to: args.status };
    }
    if (args.priority && args.priority !== task.priority) {
      changes.priority = { from: task.priority, to: args.priority };
    }

    // Update task
    const { id, ...updateArgs } = args;

    // If status is being set to completed, set completedAt
    const updateData: any = { ...updateArgs };
    if (args.status === "completed" && task.status !== "completed") {
      updateData.completedAt = Date.now();
    }

    await Tasks.updateTask(ctx, id, updateData);

    // Log activity
    if (args.status === "completed") {
      await TaskActivity.createTaskActivity(ctx, {
        taskId: id,
        userId: authUser._id,
        action: "completed",
      });
    } else if (changes.status) {
      await TaskActivity.createTaskActivity(ctx, {
        taskId: id,
        userId: authUser._id,
        action: "status_changed",
        changes: changes.status,
      });
    } else if (changes.priority) {
      await TaskActivity.createTaskActivity(ctx, {
        taskId: id,
        userId: authUser._id,
        action: "priority_changed",
        changes: changes.priority,
      });
    } else {
      await TaskActivity.createTaskActivity(ctx, {
        taskId: id,
        userId: authUser._id,
        action: "updated",
      });
    }

    return id;
  },
});

/**
 * Complete a task
 */
export const complete = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "updateTask", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify ownership
    const task = await Tasks.getTaskById(ctx, args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== authUser._id) {
      throw new Error("Not authorized to complete this task");
    }

    // Complete task
    await Tasks.completeTask(ctx, args.id);

    // Log activity
    await TaskActivity.createTaskActivity(ctx, {
      taskId: args.id,
      userId: authUser._id,
      action: "completed",
    });

    return args.id;
  },
});

/**
 * Reorder tasks (batch update positions)
 */
export const reorder = mutation({
  args: {
    updates: v.array(
      v.object({
        id: v.id("tasks"),
        position: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(
      ctx,
      "batchUpdatePositions",
      {
        key: authUser._id,
      }
    );
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify ownership of all tasks
    for (const update of args.updates) {
      const task = await Tasks.getTaskById(ctx, update.id);
      if (!task) {
        throw new Error(`Task ${update.id} not found`);
      }
      if (task.userId !== authUser._id) {
        throw new Error(`Not authorized to reorder task ${update.id}`);
      }
    }

    // Batch update positions
    await Tasks.batchUpdateTaskPositions(ctx, args.updates);

    return { success: true };
  },
});

/**
 * Delete a task
 */
export const remove = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "deleteTask", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Verify ownership
    const task = await Tasks.getTaskById(ctx, args.id);
    if (!task) {
      throw new Error("Task not found");
    }
    if (task.userId !== authUser._id) {
      throw new Error("Not authorized to delete this task");
    }

    // Log activity before deletion
    await TaskActivity.createTaskActivity(ctx, {
      taskId: args.id,
      userId: authUser._id,
      action: "deleted",
    });

    // Delete task
    await Tasks.deleteTask(ctx, args.id);

    return { success: true };
  },
});

/**
 * Delete all completed tasks
 */
export const deleteCompleted = mutation({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "deleteTask", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    const deletedCount = await Tasks.deleteCompletedTasksByUser(
      ctx,
      authUser._id
    );

    return { deletedCount };
  },
});
