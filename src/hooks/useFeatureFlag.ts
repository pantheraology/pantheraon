import { useState, useEffect, useCallback } from 'react';
import { 
  FeatureFlags, 
  isFeatureEnabled, 
  setFeatureFlag, 
  getFeatureFlags 
} from '@/lib/featureFlags';

/**
 * Hook to check if a feature flag is enabled
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag));

  useEffect(() => {
    // Re-check on mount in case flags changed
    setEnabled(isFeatureEnabled(flag));
  }, [flag]);

  return enabled;
}

/**
 * Hook to get and set a feature flag
 */
export function useFeatureFlagWithSetter<K extends keyof FeatureFlags>(
  flag: K
): [boolean, (value: boolean) => void] {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag));

  const toggle = useCallback((value: boolean) => {
    setFeatureFlag(flag, value as FeatureFlags[K]);
    setEnabled(value);
  }, [flag]);

  return [enabled, toggle];
}

/**
 * Hook to get all feature flags
 */
export function useAllFeatureFlags(): Readonly<FeatureFlags> {
  const [flags, setFlags] = useState(() => getFeatureFlags());

  useEffect(() => {
    setFlags(getFeatureFlags());
  }, []);

  return flags;
}
