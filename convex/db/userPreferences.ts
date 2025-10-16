/**
 * Database Layer: User Preferences
 *
 * This is the ONLY file that directly accesses the userPreferences table using ctx.db.
 * All user preference-related database operations are defined here as pure async functions.
 */

import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ========================================
// TYPE DEFINITIONS
// ========================================

export type Theme = "light" | "dark" | "system";
export type DefaultView = "list" | "kanban";
export type SortBy = "createdAt" | "dueDate" | "priority" | "position";
export type SortOrder = "asc" | "desc";

export interface CreateUserPreferencesArgs {
  userId: string;
  theme?: Theme;
  defaultView?: DefaultView;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  showCompletedTasks?: boolean;
  notificationsEnabled?: boolean;
}

export interface UpdateUserPreferencesArgs {
  theme?: Theme;
  defaultView?: DefaultView;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  showCompletedTasks?: boolean;
  notificationsEnabled?: boolean;
}

// ========================================
// CREATE
// ========================================

/**
 * Create user preferences with defaults
 */
export async function createUserPreferences(
  ctx: MutationCtx,
  args: CreateUserPreferencesArgs
) {
  const now = Date.now();
  return await ctx.db.insert("userPreferences", {
    userId: args.userId,
    theme: args.theme ?? "system",
    defaultView: args.defaultView ?? "list",
    sortBy: args.sortBy ?? "position",
    sortOrder: args.sortOrder ?? "asc",
    showCompletedTasks: args.showCompletedTasks ?? false,
    notificationsEnabled: args.notificationsEnabled ?? true,
    createdAt: now,
    updatedAt: now,
  });
}

// ========================================
// READ
// ========================================

/**
 * Get preferences by ID
 */
export async function getUserPreferencesById(
  ctx: QueryCtx,
  id: Id<"userPreferences">
) {
  return await ctx.db.get(id);
}

/**
 * Get user preferences by userId
 */
export async function getUserPreferencesByUser(
  ctx: QueryCtx,
  userId: string
) {
  return await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();
}

/**
 * Get or create user preferences (ensures preferences always exist)
 */
export async function getOrCreateUserPreferences(
  ctx: MutationCtx,
  userId: string
) {
  const existing = await ctx.db
    .query("userPreferences")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .first();

  if (existing) {
    return existing;
  }

  // Create default preferences
  const preferencesId = await createUserPreferences(ctx, { userId });
  const preferences = await ctx.db.get(preferencesId);
  return preferences!;
}

// ========================================
// UPDATE
// ========================================

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  ctx: MutationCtx,
  id: Id<"userPreferences">,
  args: UpdateUserPreferencesArgs
) {
  return await ctx.db.patch(id, {
    ...args,
    updatedAt: Date.now(),
  });
}

/**
 * Update user preferences by userId
 */
export async function updateUserPreferencesByUser(
  ctx: MutationCtx,
  userId: string,
  args: UpdateUserPreferencesArgs
) {
  const preferences = await getUserPreferencesByUser(ctx, userId);
  if (!preferences) {
    throw new Error("User preferences not found");
  }
  return await updateUserPreferences(ctx, preferences._id, args);
}

// ========================================
// DELETE
// ========================================

/**
 * Delete user preferences
 */
export async function deleteUserPreferences(
  ctx: MutationCtx,
  id: Id<"userPreferences">
) {
  return await ctx.db.delete(id);
}
