/**
 * Endpoint Layer: Dashboard
 *
 * Provides aggregated data and metrics for the dashboard view.
 * Only calls database-layer helpers; never accesses ctx.db directly.
 */

import { query } from "../_generated/server";
import { authComponent } from "../auth";
import * as Tasks from "../db/tasks";
import * as TaskActivity from "../db/taskActivity";
import * as Threads from "../db/threads";

/**
 * Get dashboard summary with aggregate counts
 */
export const summary = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get task counts by status
    const [pending, inProgress, completed] = await Promise.all([
      Tasks.getTaskCountByUserAndStatus(ctx, authUser._id, "pending"),
      Tasks.getTaskCountByUserAndStatus(ctx, authUser._id, "in_progress"),
      Tasks.getTaskCountByUserAndStatus(ctx, authUser._id, "completed"),
    ]);

    // Get overdue tasks
    const overdueTasks = await Tasks.getOverdueTasksByUser(
      ctx,
      authUser._id,
      Date.now()
    );

    // Get active threads
    const activeThreads = await Threads.getActiveThreadsByUser(
      ctx,
      authUser._id
    );

    // Calculate totals
    const totalTasks = pending + inProgress + completed;
    const completionRate =
      totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return {
      tasks: {
        total: totalTasks,
        pending,
        inProgress,
        completed,
        overdue: overdueTasks.length,
        completionRate,
      },
      threads: {
        active: activeThreads.length,
      },
    };
  },
});

/**
 * Get recent tasks for the dashboard
 */
export const recent = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get all tasks, sorted by creation date (descending)
    const allTasks = await Tasks.getTasksByUser(ctx, authUser._id);

    // Return the 10 most recent tasks
    return allTasks.slice(0, 10);
  },
});

/**
 * Get recent activity for the dashboard
 */
export const recentActivity = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get recent activity (last 10 items)
    return await TaskActivity.getRecentActivityByUser(ctx, authUser._id, 10);
  },
});

/**
 * Get upcoming tasks (sorted by due date)
 */
export const upcoming = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get all user tasks
    const allTasks = await Tasks.getTasksByUser(ctx, authUser._id);

    // Filter for non-completed tasks with due dates
    const upcomingTasks = allTasks
      .filter((task) => task.status !== "completed" && task.dueDate)
      .sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));

    // Return next 10 upcoming tasks
    return upcomingTasks.slice(0, 10);
  },
});

/**
 * Get high priority tasks
 */
export const highPriority = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get all user tasks
    const allTasks = await Tasks.getTasksByUser(ctx, authUser._id);

    // Filter for high priority, non-completed tasks
    const highPriorityTasks = allTasks
      .filter((task) => task.priority === "high" && task.status !== "completed")
      .sort((a, b) => b.createdAt - a.createdAt);

    return highPriorityTasks.slice(0, 10);
  },
});

/**
 * Get productivity stats
 */
export const productivityStats = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

    // Get all tasks
    const allTasks = await Tasks.getTasksByUser(ctx, authUser._id);

    // Tasks created today
    const createdToday = allTasks.filter((task) => task.createdAt >= oneDayAgo).length;

    // Tasks completed today
    const completedToday = allTasks.filter(
      (task) => task.completedAt && task.completedAt >= oneDayAgo
    ).length;

    // Tasks created this week
    const createdThisWeek = allTasks.filter(
      (task) => task.createdAt >= oneWeekAgo
    ).length;

    // Tasks completed this week
    const completedThisWeek = allTasks.filter(
      (task) => task.completedAt && task.completedAt >= oneWeekAgo
    ).length;

    return {
      today: {
        created: createdToday,
        completed: completedToday,
      },
      thisWeek: {
        created: createdThisWeek,
        completed: completedThisWeek,
      },
    };
  },
});
