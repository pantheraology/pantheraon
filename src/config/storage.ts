/**
 * Centralized storage keys for localStorage
 * Using a single source of truth prevents typos and makes it easy to
 * find all storage usage across the codebase.
 */
export const STORAGE_KEYS = {
  CONVERSATIONS: 'pantheraon-conversations',
  SPACES: 'pantheraon-spaces',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
