import { useCallback, useRef, useState, useEffect } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  duration?: number;
  onStart?: () => void;
  onCancel?: () => void;
  moveThreshold?: number; // pixels of movement allowed before canceling
}

export const useLongPress = ({
  onLongPress,
  duration = 2000,
  onStart,
  onCancel,
  moveThreshold = 10,
}: UseLongPressOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const [isLongPressActive, setIsLongPressActive] = useState(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const start = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsLongPressActive(false);
    
    // Store starting position for touch move detection
    if ('touches' in e && e.touches.length > 0) {
      startPositionRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if ('clientX' in e) {
      startPositionRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    }
    
    onStart?.();
    
    timerRef.current = setTimeout(() => {
      setIsLongPressActive(true);
      onLongPress();
    }, duration);
  }, [onLongPress, duration, onStart]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startPositionRef.current = null;
    if (!isLongPressActive) {
      onCancel?.();
    }
    setIsLongPressActive(false);
  }, [onCancel, isLongPressActive]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPositionRef.current || !timerRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - startPositionRef.current.x);
    const deltaY = Math.abs(touch.clientY - startPositionRef.current.y);
    
    // Cancel if finger moved too much
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      cancel();
    }
  }, [moveThreshold, cancel]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: handleTouchMove,
  };

  return {
    handlers,
    isLongPressActive,
  };
};
