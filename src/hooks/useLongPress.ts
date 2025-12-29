import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  duration?: number;
  onStart?: () => void;
  onCancel?: () => void;
}

export const useLongPress = ({
  onLongPress,
  duration = 2000,
  onStart,
  onCancel,
}: UseLongPressOptions) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    onStart?.();
    
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, duration);
  }, [onLongPress, duration, onStart]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPressRef.current) {
      onCancel?.();
    }
  }, [onCancel]);

  const handlers = {
    onMouseDown: start,
    onMouseUp: cancel,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: cancel,
  };

  return {
    handlers,
    isLongPressActive: isLongPressRef.current,
  };
};
