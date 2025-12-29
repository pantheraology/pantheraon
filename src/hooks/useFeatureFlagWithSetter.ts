/**
 * Hook to get and set a feature flag
 */

import { useState, useCallback } from 'react';
import { 
  FeatureFlags, 
  isFeatureEnabled, 
  setFeatureFlag 
} from '@/lib/featureFlags';

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
