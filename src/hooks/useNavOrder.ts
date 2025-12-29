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

  const resetOrder = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setOrderedItems(navItems);
  }, []);

  return {
    orderedItems,
    reorderItems,
    resetOrder,
  };
};
