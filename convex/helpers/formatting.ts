/**
 * Formatting Helpers
 *
 * Pure functions for formatting data.
 * NO database access, NO ctx parameter.
 */

// ========================================
// DATE FORMATTING
// ========================================

/**
 * Check if a date is overdue
 */
export function isOverdue(dueDate: number, currentTime: number = Date.now()): boolean {
  return dueDate < currentTime;
}

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function getRelativeTimeString(timestamp: number, baseTime: number = Date.now()): string {
  const diff = timestamp - baseTime;
  const absDiff = Math.abs(diff);
  const isPast = diff < 0;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  let value: number;
  let unit: string;

  if (absDiff < minute) {
    return isPast ? "just now" : "in a moment";
  } else if (absDiff < hour) {
    value = Math.floor(absDiff / minute);
    unit = value === 1 ? "minute" : "minutes";
  } else if (absDiff < day) {
    value = Math.floor(absDiff / hour);
    unit = value === 1 ? "hour" : "hours";
  } else if (absDiff < week) {
    value = Math.floor(absDiff / day);
    unit = value === 1 ? "day" : "days";
  } else {
    value = Math.floor(absDiff / week);
    unit = value === 1 ? "week" : "weeks";
  }

  return isPast ? `${value} ${unit} ago` : `in ${value} ${unit}`;
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString();
}

/**
 * Format timestamp to date and time string
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

// ========================================
// TEXT FORMATTING
// ========================================

/**
 * Truncate text to max length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert snake_case or kebab-case to Title Case
 */
export function toTitleCase(text: string): string {
  return text
    .replace(/[_-]/g, " ")
    .split(" ")
    .map(capitalize)
    .join(" ");
}

// ========================================
// TAG FORMATTING
// ========================================

/**
 * Normalize tag (lowercase, trim, remove special chars)
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

/**
 * Format tags for display
 */
export function formatTags(tags: string[]): string {
  return tags.map((tag) => `#${tag}`).join(" ");
}

// ========================================
// ACTIVITY FORMATTING
// ========================================

/**
 * Format activity action to human-readable string
 */
export function formatActivityAction(
  action: string,
  changes?: any
): string {
  switch (action) {
    case "created":
      return "Created task";
    case "updated":
      return "Updated task";
    case "completed":
      return "Completed task";
    case "deleted":
      return "Deleted task";
    case "status_changed":
      if (changes?.from && changes?.to) {
        return `Changed status from ${changes.from} to ${changes.to}`;
      }
      return "Changed status";
    case "priority_changed":
      if (changes?.from && changes?.to) {
        return `Changed priority from ${changes.from} to ${changes.to}`;
      }
      return "Changed priority";
    default:
      return action;
  }
}

// ========================================
// NUMBER FORMATTING
// ========================================

/**
 * Format count with label (e.g., "1 task", "3 tasks")
 */
export function formatCount(count: number, singular: string, plural?: string): string {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + "s"}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, total: number): string {
  if (total === 0) return "0%";
  const percentage = Math.round((value / total) * 100);
  return `${percentage}%`;
}
