import { useState, useCallback, useRef } from 'react';

interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  pullProgress: number; // 0-1
}

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
}

export const usePullToRefresh = ({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions) => {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    pullProgress: 0,
  });

  const startY = useRef(0);
  const scrollableRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only start pull if at top of scroll container
    const scrollTop = scrollableRef.current?.scrollTop || 0;
    if (scrollTop > 0) return;

    startY.current = e.touches[0].clientY;
    setState(prev => ({ ...prev, isPulling: true }));
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isPulling || state.isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff < 0) return; // Only allow pulling down

    // Apply resistance
    const pullDistance = Math.min(diff * 0.5, maxPull);
    const pullProgress = Math.min(pullDistance / threshold, 1);

    setState(prev => ({
      ...prev,
      pullDistance,
      pullProgress,
    }));
  }, [state.isPulling, state.isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling) return;

    if (state.pullDistance >= threshold && !state.isRefreshing) {
      setState(prev => ({ ...prev, isRefreshing: true, pullDistance: threshold }));
      
      try {
        await onRefresh();
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          pullProgress: 0,
        });
      }
    } else {
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        pullProgress: 0,
      });
    }
  }, [state.isPulling, state.pullDistance, state.isRefreshing, threshold, onRefresh]);

  const setScrollableRef = useCallback((el: HTMLElement | null) => {
    scrollableRef.current = el;
  }, []);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    setScrollableRef,
  };
};
