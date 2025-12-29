/**
 * Feature Flags System
 * Centralized feature toggle management for gradual rollouts and A/B testing
 */

export interface FeatureFlags {
  // Core features
  enableGroupChats: boolean;
  enableAgentBuilder: boolean;
  enableStudio: boolean;
  enableSpaces: boolean;
  
  // Experimental features
  enableVoiceInput: boolean;
  enableImageGeneration: boolean;
  enableVideoGeneration: boolean;
  enableAdvancedAnalytics: boolean;
  
  // UX features
  enableKeyboardShortcuts: boolean;
  enableDarkModeToggle: boolean;
  enableAnimations: boolean;
  
  // Debug features
  enableDebugMode: boolean;
  enablePerformanceMonitoring: boolean;
}

const defaultFlags: FeatureFlags = {
  // Core features - enabled by default
  enableGroupChats: true,
  enableAgentBuilder: true,
  enableStudio: true,
  enableSpaces: true,
  
  // Experimental features
  enableVoiceInput: false,
  enableImageGeneration: true,
  enableVideoGeneration: false,
  enableAdvancedAnalytics: false,
  
  // UX features
  enableKeyboardShortcuts: true,
  enableDarkModeToggle: true,
  enableAnimations: true,
  
  // Debug features
  enableDebugMode: import.meta.env.DEV,
  enablePerformanceMonitoring: import.meta.env.DEV,
};

// Storage key for persisted overrides
const STORAGE_KEY = 'feature_flags_overrides';

/**
 * Get persisted flag overrides from localStorage
 */
function getPersistedOverrides(): Partial<FeatureFlags> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Persist flag overrides to localStorage
 */
function persistOverrides(overrides: Partial<FeatureFlags>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    console.warn('Failed to persist feature flag overrides');
  }
}

// Current active flags (merged defaults + overrides)
let activeFlags: FeatureFlags = { ...defaultFlags, ...getPersistedOverrides() };

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled<K extends keyof FeatureFlags>(flag: K): boolean {
  return activeFlags[flag];
}

/**
 * Get all current feature flags
 */
export function getFeatureFlags(): Readonly<FeatureFlags> {
  return { ...activeFlags };
}

/**
 * Override a feature flag (persists to localStorage)
 */
export function setFeatureFlag<K extends keyof FeatureFlags>(
  flag: K,
  value: FeatureFlags[K]
): void {
  const overrides = getPersistedOverrides();
  overrides[flag] = value;
  persistOverrides(overrides);
  activeFlags = { ...defaultFlags, ...overrides };
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  localStorage.removeItem(STORAGE_KEY);
  activeFlags = { ...defaultFlags };
}

/**
 * Initialize feature flags from remote config (placeholder for future implementation)
 */
export async function initializeFeatureFlags(): Promise<void> {
  // Future: Fetch from remote config service
  // const remoteFlags = await fetchRemoteFlags();
  // activeFlags = { ...defaultFlags, ...remoteFlags, ...getPersistedOverrides() };
  
  activeFlags = { ...defaultFlags, ...getPersistedOverrides() };
}
