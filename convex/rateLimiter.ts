/**
 * Rate Limiter Configuration
 *
 * Configures rate limiting for all mutations to prevent abuse.
 * Uses token bucket algorithm for most operations (allows bursts).
 */

import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";

/**
 * Rate limiter instance with predefined limits
 *
 * Token bucket algorithm:
 * - Allows bursts (capacity parameter)
 * - Refills tokens over time (rate parameter)
 * - Good for user actions that may come in batches
 *
 * Usage in mutations:
 *   const status = await rateLimiter.limit(ctx, "createTask", { key: user._id });
 *   if (!status.ok) {
 *     throw new Error(`Rate limit exceeded. Retry after ${status.retryAfter}ms`);
 *   }
 *
 * Usage in queries (check only, doesn't consume):
 *   const status = await rateLimiter.check(ctx, "createTask", { key: user._id });
 */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // ========================================
  // TASK OPERATIONS
  // ========================================

  // Create task: 30 per minute with burst capacity of 5
  createTask: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 5,
  },

  // Update task: 60 per minute (more frequent updates expected)
  updateTask: {
    kind: "token bucket",
    rate: 60,
    period: MINUTE,
    capacity: 10,
  },

  // Delete task: 20 per minute
  deleteTask: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 3,
  },

  // Batch update positions: 10 per minute (drag-and-drop)
  batchUpdatePositions: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 2,
  },

  // ========================================
  // COMMENT OPERATIONS
  // ========================================

  // Create comment: 20 per minute
  createComment: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 3,
  },

  // Update comment: 30 per minute
  updateComment: {
    kind: "token bucket",
    rate: 30,
    period: MINUTE,
    capacity: 5,
  },

  // Delete comment: 15 per minute
  deleteComment: {
    kind: "token bucket",
    rate: 15,
    period: MINUTE,
    capacity: 2,
  },

  // ========================================
  // AI AGENT OPERATIONS
  // ========================================

  // Send message: 10 per minute (AI operations are expensive)
  sendMessage: {
    kind: "token bucket",
    rate: 10,
    period: MINUTE,
    capacity: 2,
  },

  // Create thread: 5 per minute
  createThread: {
    kind: "token bucket",
    rate: 5,
    period: MINUTE,
    capacity: 1,
  },

  // ========================================
  // USER PREFERENCES
  // ========================================

  // Update preferences: 20 per minute
  updatePreferences: {
    kind: "token bucket",
    rate: 20,
    period: MINUTE,
    capacity: 3,
  },
});
