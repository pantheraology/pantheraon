import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  action: () => void;
  description: string;
}

/**
 * Global keyboard shortcuts hook
 * Supports Cmd/Ctrl + key combinations
 */
export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      metaKey: true,
      action: () => navigate('/'),
      description: 'New chat / Go home',
    },
    {
      key: 'i',
      metaKey: true,
      action: () => navigate('/studio'),
      description: 'Open Studio',
    },
    {
      key: 'd',
      metaKey: true,
      shiftKey: true,
      action: () => navigate('/discover'),
      description: 'Go to Discover',
    },
    {
      key: 'g',
      metaKey: true,
      shiftKey: true,
      action: () => navigate('/groups'),
      description: 'Go to Groups',
    },
    {
      key: ',',
      metaKey: true,
      action: () => navigate('/settings'),
      description: 'Open Settings',
    },
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      // Allow Escape to blur
      if (event.key === 'Escape') {
        target.blur();
      }
      return;
    }

    const matchedShortcut = shortcuts.find((shortcut) => {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const metaMatches = shortcut.metaKey ? (event.metaKey || event.ctrlKey) : true;
      const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
      
      return keyMatches && metaMatches && shiftMatches;
    });

    if (matchedShortcut) {
      event.preventDefault();
      matchedShortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return { shortcuts };
};
