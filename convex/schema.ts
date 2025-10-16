import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Database Schema for Distraction-Free To-Do List
 *
 * Following the four-layer Convex architecture pattern:
 * - User-scoped tables with userId
 * - Status-based with literal unions
 * - Timestamp fields (createdAt, updatedAt)
 * - Proper indexes for common queries
 */

export default defineSchema({
  // ========================================
  // CORE APPLICATION TABLES
  // ========================================

  /**
   * Tasks - The core to-do items
   * Each task belongs to a user and has a status
   */
  tasks: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("in_progress"),
      v.literal("completed")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high")
    ),
    dueDate: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    position: v.number(), // For drag-and-drop ordering
    tags: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_position", ["userId", "position"])
    .index("by_due_date", ["dueDate"]),

  /**
   * Task Comments - Optional comments/notes on tasks
   * Supports collaboration and task history
   */
  taskComments: defineTable({
    taskId: v.id("tasks"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"]),

  /**
   * Task Activity - Audit log for task changes
   * Tracks all modifications for accountability
   */
  taskActivity: defineTable({
    taskId: v.id("tasks"),
    userId: v.string(),
    action: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("completed"),
      v.literal("deleted"),
      v.literal("status_changed"),
      v.literal("priority_changed")
    ),
    changes: v.optional(v.any()), // Store before/after state
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_user", ["userId"])
    .index("by_task_and_created", ["taskId", "createdAt"]),

  /**
   * User Preferences - UI/UX settings per user
   * Theme, sorting preferences, etc.
   */
  userPreferences: defineTable({
    userId: v.string(),
    theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    defaultView: v.union(v.literal("list"), v.literal("kanban")),
    sortBy: v.union(
      v.literal("createdAt"),
      v.literal("dueDate"),
      v.literal("priority"),
      v.literal("position")
    ),
    sortOrder: v.union(v.literal("asc"), v.literal("desc")),
    showCompletedTasks: v.boolean(),
    notificationsEnabled: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ========================================
  // AI AGENT COMPONENT TABLES
  // ========================================

  /**
   * Agent Threads - Conversation threads for AI assistant
   * Users can chat with AI about their tasks
   */
  threads: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("archived")),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_last_message", ["userId", "lastMessageAt"]),

  /**
   * Agent Messages - Individual messages in threads
   * Stores user queries and AI responses
   */
  messages: defineTable({
    threadId: v.id("threads"),
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    metadata: v.optional(v.any()), // Store token usage, model info, etc.
    createdAt: v.number(),
  })
    .index("by_thread", ["threadId"])
    .index("by_thread_and_created", ["threadId", "createdAt"]),

  // ========================================
  // TEXT STREAMING COMPONENT TABLES
  // ========================================
  // The persistent-text-streaming component manages its own internal tables
  // No additional schema required - it handles streaming state automatically
});
