import { useState, useCallback, useRef } from 'react';

interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  edgeWidth?: number;
}

interface SwipeState {
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
}

export const useSwipeGesture = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  edgeWidth = 20,
}: SwipeConfig = {}) => {
  const [state, setState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    isSwiping: false,
    direction: null,
  });

  const isFromEdge = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    isFromEdge.current = touch.clientX <= edgeWidth;
    
    setState({
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      isSwiping: true,
      direction: null,
    });
  }, [edgeWidth]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isSwiping) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;

    let direction: 'left' | 'right' | 'up' | 'down' | null = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setState(prev => ({
      ...prev,
      deltaX,
      deltaY,
      direction,
    }));
  }, [state.isSwiping, state.startX, state.startY]);

  const handleTouchEnd = useCallback(() => {
    const { deltaX, deltaY, direction } = state;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > threshold || absY > threshold) {
      if (direction === 'left' && absX > absY && onSwipeLeft) {
        onSwipeLeft();
      } else if (direction === 'right' && absX > absY && onSwipeRight) {
        // Only trigger if started from edge (for opening sidebar)
        if (isFromEdge.current || !onSwipeRight.toString().includes('open')) {
          onSwipeRight();
        }
      } else if (direction === 'up' && absY > absX && onSwipeUp) {
        onSwipeUp();
      } else if (direction === 'down' && absY > absX && onSwipeDown) {
        onSwipeDown();
      }
    }

    setState({
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      isSwiping: false,
      direction: null,
    });
    isFromEdge.current = false;
  }, [state, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    state,
    isFromEdge: isFromEdge.current,
  };
};
