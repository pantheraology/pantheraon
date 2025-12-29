import { useState, useEffect, useCallback, useRef } from 'react';

interface KeyboardState {
  isVisible: boolean;
  height: number;
}

export const useKeyboardAware = () => {
  const [keyboard, setKeyboard] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });
  const initialHeight = useRef<number>(0);

  useEffect(() => {
    // Use visualViewport API for accurate keyboard detection
    const viewport = window.visualViewport;
    if (!viewport) return;

    initialHeight.current = viewport.height;

    const handleResize = () => {
      const currentHeight = viewport.height;
      const heightDiff = initialHeight.current - currentHeight;
      
      // Keyboard is likely open if height difference is significant (> 100px)
      const isKeyboardOpen = heightDiff > 100;
      
      setKeyboard({
        isVisible: isKeyboardOpen,
        height: isKeyboardOpen ? heightDiff : 0,
      });

      // Update CSS variable for use in styles
      document.documentElement.style.setProperty(
        '--keyboard-height',
        `${isKeyboardOpen ? heightDiff : 0}px`
      );
    };

    const handleScroll = () => {
      // Prevent iOS bounce when keyboard is open
      if (keyboard.isVisible) {
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
      } else {
        document.body.style.position = '';
        document.body.style.width = '';
      }
    };

    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleScroll);

    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleScroll);
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [keyboard.isVisible]);

  const scrollInputIntoView = useCallback((element: HTMLElement) => {
    // Delay to let keyboard animation complete
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  return {
    ...keyboard,
    scrollInputIntoView,
  };
};
