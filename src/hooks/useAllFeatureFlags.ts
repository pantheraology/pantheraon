/**
 * Hook to get all feature flags
 */

import { useState, useEffect } from 'react';
import { FeatureFlags, getFeatureFlags } from '@/lib/featureFlags';

export function useAllFeatureFlags(): Readonly<FeatureFlags> {
  const [flags, setFlags] = useState(() => getFeatureFlags());

  useEffect(() => {
    setFlags(getFeatureFlags());
  }, []);

  return flags;
}
