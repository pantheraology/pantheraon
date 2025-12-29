// Centralized date formatting utilities
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/**
 * Formats a date to a relative time string (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

/**
 * Formats a date to a human-readable string with smart formatting
 * - Today: "Today at 2:30 PM"
 * - Yesterday: "Yesterday at 2:30 PM"
 * - This year: "Mar 15 at 2:30 PM"
 * - Other: "Mar 15, 2023 at 2:30 PM"
 */
export const formatSmartDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(d)) {
    return `Today at ${format(d, 'h:mm a')}`;
  }
  
  if (isYesterday(d)) {
    return `Yesterday at ${format(d, 'h:mm a')}`;
  }
  
  const isThisYear = d.getFullYear() === new Date().getFullYear();
  
  if (isThisYear) {
    return format(d, 'MMM d') + ` at ${format(d, 'h:mm a')}`;
  }
  
  return format(d, 'MMM d, yyyy') + ` at ${format(d, 'h:mm a')}`;
};

/**
 * Formats a date for display (e.g., "March 15, 2023")
 */
export const formatDisplayDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMMM d, yyyy');
};

/**
 * Formats a short date (e.g., "Mar 15")
 */
export const formatShortDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d');
};
