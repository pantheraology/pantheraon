import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse an ISO date string from localStorage into a Date object
 */
export function parseStoredDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Convert a Date object to an ISO string for localStorage storage
 */
export function toStoredDate(date: Date): string {
  return date.toISOString();
}
