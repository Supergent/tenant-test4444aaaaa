/**
 * Endpoint Layer: Task Activity
 *
 * Business logic for task activity logs.
 * Provides read-only access to activity history.
 */

import { v } from "convex/values";
import { query } from "../_generated/server";
import { authComponent } from "../auth";
import * as TaskActivity from "../db/taskActivity";
import * as Tasks from "../db/tasks";

// ========================================
// QUERIES
// ========================================

/**
 * List all activity for a task
 */
export const listByTask = query({
  args: {
    taskId: v.id("tasks"),
    limit: v.optional(v.number()),
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
      throw new Error("Not authorized to view activity for this task");
    }

    return await TaskActivity.getTaskActivityByTaskAndTime(
      ctx,
      args.taskId,
      args.limit
    );
  },
});

/**
 * List recent activity for the user
 */
export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    return await TaskActivity.getRecentActivityByUser(
      ctx,
      authUser._id,
      args.limit ?? 20
    );
  },
});

/**
 * Get a single activity record by ID
 */
export const get = query({
  args: {
    id: v.id("taskActivity"),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const activity = await TaskActivity.getTaskActivityById(ctx, args.id);
    if (!activity) {
      throw new Error("Activity not found");
    }

    // Verify ownership
    if (activity.userId !== authUser._id) {
      throw new Error("Not authorized to view this activity");
    }

    return activity;
  },
});
