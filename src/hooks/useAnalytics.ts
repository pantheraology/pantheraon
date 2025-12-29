import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackEvent, 
  trackPageView, 
  createTimer, 
  EventCategory,
  analytics 
} from '@/lib/analytics';

/**
 * Hook to track page views automatically
 */
export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}

/**
 * Hook to track a specific event
 */
export function useTrackEvent() {
  return useCallback((
    category: EventCategory,
    action: string,
    options?: {
      label?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    }
  ) => {
    trackEvent(category, action, options);
  }, []);
}

/**
 * Hook to measure and track timing of an async operation
 */
export function useTimedAction<T>(
  category: EventCategory,
  action: string
) {
  return useCallback(async (asyncFn: () => Promise<T>): Promise<T> => {
    const timer = createTimer(category, action);
    try {
      const result = await asyncFn();
      timer.stop();
      return result;
    } catch (error) {
      timer.stop();
      throw error;
    }
  }, [category, action]);
}

/**
 * Hook to get pre-configured analytics functions
 */
export function useAnalytics() {
  return analytics;
}
