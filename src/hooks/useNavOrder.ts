import { useState, useEffect, useCallback } from 'react';
import { navItems, NavItem } from '@/config/navigation';

const STORAGE_KEY = 'nav-order';

export const useNavOrder = () => {
  const [orderedItems, setOrderedItems] = useState<NavItem[]>(navItems);

  // Load order from localStorage on mount
  useEffect(() => {
    const savedOrder = localStorage.getItem(STORAGE_KEY);
    if (savedOrder) {
      try {
        const orderPaths: string[] = JSON.parse(savedOrder);
        // Reorder navItems based on saved paths, handling any new/removed items
        const reordered = orderPaths
          .map(path => navItems.find(item => item.path === path))
          .filter((item): item is NavItem => item !== undefined);
        
        // Add any new items that weren't in the saved order
        const newItems = navItems.filter(
          item => !orderPaths.includes(item.path)
        );
        
        setOrderedItems([...reordered, ...newItems]);
      } catch {
        setOrderedItems(navItems);
      }
    }
  }, []);

  // Reorder using full array indices
  const reorderItems = useCallback((fromIndex: number, toIndex: number) => {
    setOrderedItems(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      
      // Save to localStorage
      const orderPaths = newItems.map(item => item.path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderPaths));
      
      return newItems;
    });
  }, []);

  // Reorder using visible items indices - maps back to full array
  const reorderVisibleItems = useCallback((
    visibleItems: NavItem[],
    fromVisibleIndex: number,
    toVisibleIndex: number
  ) => {
    setOrderedItems(prev => {
      // Get the items being moved from the visible array
      const itemToMove = visibleItems[fromVisibleIndex];
      const targetItem = visibleItems[toVisibleIndex];
      
      if (!itemToMove || !targetItem) return prev;
      
      // Find their actual indices in the full ordered array
      const fromFullIndex = prev.findIndex(item => item.path === itemToMove.path);
      const toFullIndex = prev.findIndex(item => item.path === targetItem.path);
      
      if (fromFullIndex === -1 || toFullIndex === -1) return prev;
      
      // Perform the reorder on the full array
      const newItems = [...prev];
      const [removed] = newItems.splice(fromFullIndex, 1);
      newItems.splice(toFullIndex, 0, removed);
      
      // Save to localStorage
      const orderPaths = newItems.map(item => item.path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orderPaths));
      
      return newItems;
    });
  }, []);

  const resetOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrderedItems(navItems);
  }, []);

  return {
    orderedItems,
    reorderItems,
    reorderVisibleItems,
    resetOrder,
  };
};
