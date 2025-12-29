/**
 * Hook to check if a feature flag is enabled
 */

import { useState, useEffect } from 'react';
import { FeatureFlags, isFeatureEnabled } from '@/lib/featureFlags';

export function useFeatureFlag<K extends keyof FeatureFlags>(flag: K): boolean {
  const [enabled, setEnabled] = useState(() => isFeatureEnabled(flag));

  useEffect(() => {
    // Re-check on mount in case flags changed
    setEnabled(isFeatureEnabled(flag));
  }, [flag]);

  return enabled;
}

// Re-export from split files for convenience
export { useFeatureFlagWithSetter } from './useFeatureFlagWithSetter';
export { useAllFeatureFlags } from './useAllFeatureFlags';
