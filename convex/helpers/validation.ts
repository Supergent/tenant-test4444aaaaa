/**
 * Validation Helpers
 *
 * Pure functions for input validation.
 * NO database access, NO ctx parameter.
 */

// ========================================
// EMAIL VALIDATION
// ========================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

// ========================================
// TASK VALIDATION
// ========================================

/**
 * Validate task title
 * Must be non-empty and max 200 characters
 */
export function isValidTaskTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 200;
}

/**
 * Validate task description
 * Optional, but if provided max 2000 characters
 */
export function isValidTaskDescription(description?: string): boolean {
  if (!description) return true;
  return description.length <= 2000;
}

/**
 * Validate due date
 * Must be a future timestamp (unless allowing past dates for updates)
 */
export function isValidDueDate(dueDate: number, allowPast: boolean = false): boolean {
  if (!allowPast && dueDate < Date.now()) {
    return false;
  }
  return true;
}

/**
 * Validate task tags
 * Each tag must be non-empty and max 50 characters
 * Max 10 tags per task
 */
export function isValidTaskTags(tags?: string[]): boolean {
  if (!tags) return true;
  if (tags.length > 10) return false;
  return tags.every((tag) => tag.trim().length > 0 && tag.length <= 50);
}

// ========================================
// COMMENT VALIDATION
// ========================================

/**
 * Validate comment content
 * Must be non-empty and max 1000 characters
 */
export function isValidCommentContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= 1000;
}

// ========================================
// MESSAGE VALIDATION
// ========================================

/**
 * Validate AI message content
 * Must be non-empty and max 10000 characters
 */
export function isValidMessageContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= 10000;
}

/**
 * Validate thread title
 * Optional, but if provided max 100 characters
 */
export function isValidThreadTitle(title?: string): boolean {
  if (!title) return true;
  return title.length <= 100;
}

// ========================================
// POSITION VALIDATION
// ========================================

/**
 * Validate position value
 * Must be non-negative
 */
export function isValidPosition(position: number): boolean {
  return position >= 0 && Number.isInteger(position);
}

// ========================================
// COMBINED VALIDATORS
// ========================================

/**
 * Validate complete task input
 */
export interface TaskValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateTaskInput(input: {
  title: string;
  description?: string;
  dueDate?: number;
  tags?: string[];
}): TaskValidationResult {
  const errors: string[] = [];

  if (!isValidTaskTitle(input.title)) {
    errors.push("Title must be between 1 and 200 characters");
  }

  if (!isValidTaskDescription(input.description)) {
    errors.push("Description must be max 2000 characters");
  }

  if (input.dueDate && !isValidDueDate(input.dueDate)) {
    errors.push("Due date must be in the future");
  }

  if (!isValidTaskTags(input.tags)) {
    errors.push("Tags must be max 50 characters each, max 10 tags");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
