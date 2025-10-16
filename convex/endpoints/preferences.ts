/**
 * Endpoint Layer: User Preferences
 *
 * Business logic for user preferences.
 * Manages UI/UX settings per user.
 */

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { authComponent } from "../auth";
import { rateLimiter } from "../rateLimiter";
import * as UserPreferences from "../db/userPreferences";

// ========================================
// QUERIES
// ========================================

/**
 * Get user preferences (creates default if not exists)
 */
export const get = query({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Get or create preferences
    let preferences = await UserPreferences.getUserPreferencesByUser(
      ctx,
      authUser._id
    );

    // If no preferences exist, return defaults without creating
    // (mutations can't be called from queries)
    if (!preferences) {
      return {
        userId: authUser._id,
        theme: "system" as const,
        defaultView: "list" as const,
        sortBy: "position" as const,
        sortOrder: "asc" as const,
        showCompletedTasks: false,
        notificationsEnabled: true,
        _id: null, // Indicates these are defaults, not saved
      };
    }

    return preferences;
  },
});

// ========================================
// MUTATIONS
// ========================================

/**
 * Initialize user preferences (called on first login)
 */
export const initialize = mutation({
  handler: async (ctx) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Check if preferences already exist
    const existing = await UserPreferences.getUserPreferencesByUser(
      ctx,
      authUser._id
    );
    if (existing) {
      return existing._id;
    }

    // Create default preferences
    const preferencesId = await UserPreferences.createUserPreferences(ctx, {
      userId: authUser._id,
    });

    return preferencesId;
  },
});

/**
 * Update user preferences
 */
export const update = mutation({
  args: {
    theme: v.optional(
      v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
    ),
    defaultView: v.optional(v.union(v.literal("list"), v.literal("kanban"))),
    sortBy: v.optional(
      v.union(
        v.literal("createdAt"),
        v.literal("dueDate"),
        v.literal("priority"),
        v.literal("position")
      )
    ),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    showCompletedTasks: v.optional(v.boolean()),
    notificationsEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "updatePreferences", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Get or create preferences
    const preferences = await UserPreferences.getOrCreateUserPreferences(
      ctx,
      authUser._id
    );

    // Update preferences
    await UserPreferences.updateUserPreferences(ctx, preferences._id, args);

    return preferences._id;
  },
});

/**
 * Update theme only (common operation)
 */
export const updateTheme = mutation({
  args: {
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "updatePreferences", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Get or create preferences
    const preferences = await UserPreferences.getOrCreateUserPreferences(
      ctx,
      authUser._id
    );

    // Update theme
    await UserPreferences.updateUserPreferences(ctx, preferences._id, {
      theme: args.theme,
    });

    return preferences._id;
  },
});

/**
 * Update default view only
 */
export const updateDefaultView = mutation({
  args: {
    defaultView: v.union(v.literal("list"), v.literal("kanban")),
  },
  handler: async (ctx, args) => {
    const authUser = await authComponent.getAuthUser(ctx);
    if (!authUser) {
      throw new Error("Not authenticated");
    }

    // Rate limiting
    const rateLimitStatus = await rateLimiter.limit(ctx, "updatePreferences", {
      key: authUser._id,
    });
    if (!rateLimitStatus.ok) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimitStatus.retryAfter}ms`
      );
    }

    // Get or create preferences
    const preferences = await UserPreferences.getOrCreateUserPreferences(
      ctx,
      authUser._id
    );

    // Update default view
    await UserPreferences.updateUserPreferences(ctx, preferences._id, {
      defaultView: args.defaultView,
    });

    return preferences._id;
  },
});
