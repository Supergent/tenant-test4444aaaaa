/**
 * Application Constants
 *
 * Centralized constants for the application.
 * NO database access, NO ctx parameter.
 */

// ========================================
// PAGINATION
// ========================================

export const PAGINATION_LIMIT = 50;
export const MAX_TASKS_PER_PAGE = 100;
export const MAX_MESSAGES_PER_THREAD = 100;

// ========================================
// RATE LIMITING
// ========================================

export const RATE_LIMITS = {
  CREATE_TASK: {
    requests: 30,
    windowMs: 60000, // 1 minute
  },
  UPDATE_TASK: {
    requests: 60,
    windowMs: 60000,
  },
  DELETE_TASK: {
    requests: 20,
    windowMs: 60000,
  },
  CREATE_COMMENT: {
    requests: 20,
    windowMs: 60000,
  },
  SEND_MESSAGE: {
    requests: 10,
    windowMs: 60000,
  },
} as const;

// ========================================
// TASK STATUS
// ========================================

export const TASK_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: "Pending",
  [TASK_STATUS.IN_PROGRESS]: "In Progress",
  [TASK_STATUS.COMPLETED]: "Completed",
} as const;

export const TASK_STATUS_COLORS = {
  [TASK_STATUS.PENDING]: "gray",
  [TASK_STATUS.IN_PROGRESS]: "blue",
  [TASK_STATUS.COMPLETED]: "green",
} as const;

// ========================================
// TASK PRIORITY
// ========================================

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITY.LOW]: "Low",
  [TASK_PRIORITY.MEDIUM]: "Medium",
  [TASK_PRIORITY.HIGH]: "High",
} as const;

export const TASK_PRIORITY_COLORS = {
  [TASK_PRIORITY.LOW]: "gray",
  [TASK_PRIORITY.MEDIUM]: "yellow",
  [TASK_PRIORITY.HIGH]: "red",
} as const;

// ========================================
// STATUS TRANSITIONS
// ========================================

/**
 * Valid status transitions for tasks
 */
export const VALID_STATUS_TRANSITIONS = {
  [TASK_STATUS.PENDING]: [TASK_STATUS.IN_PROGRESS, TASK_STATUS.COMPLETED],
  [TASK_STATUS.IN_PROGRESS]: [TASK_STATUS.PENDING, TASK_STATUS.COMPLETED],
  [TASK_STATUS.COMPLETED]: [TASK_STATUS.PENDING, TASK_STATUS.IN_PROGRESS],
} as const;

/**
 * Check if a status transition is valid
 */
export function isValidStatusTransition(
  from: keyof typeof VALID_STATUS_TRANSITIONS,
  to: string
): boolean {
  return VALID_STATUS_TRANSITIONS[from].includes(to as any);
}

// ========================================
// USER PREFERENCES DEFAULTS
// ========================================

export const DEFAULT_USER_PREFERENCES = {
  theme: "system",
  defaultView: "list",
  sortBy: "position",
  sortOrder: "asc",
  showCompletedTasks: false,
  notificationsEnabled: true,
} as const;

// ========================================
// TIME CONSTANTS
// ========================================

export const TIME = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

// ========================================
// VALIDATION LIMITS
// ========================================

export const VALIDATION_LIMITS = {
  TASK_TITLE_MAX: 200,
  TASK_DESCRIPTION_MAX: 2000,
  TASK_TAGS_MAX: 10,
  TASK_TAG_LENGTH_MAX: 50,
  COMMENT_CONTENT_MAX: 1000,
  MESSAGE_CONTENT_MAX: 10000,
  THREAD_TITLE_MAX: 100,
} as const;
