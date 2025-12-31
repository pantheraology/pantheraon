/**
 * Sidebar Drag Hook
 * Handles all drag and drop logic for sidebar navigation reordering
 */

import { useState, useCallback, useRef } from 'react';

interface UseSidebarDragProps<T> {
  items: T[];
  onReorder: (items: T[], fromIndex: number, toIndex: number) => void;
  isEditMode: boolean;
}

export const useSidebarDrag = <T,>({ items, onReorder, isEditMode }: UseSidebarDragProps<T>) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below'>('above');
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    
    // Create custom drag image
    const target = e.currentTarget as HTMLElement;
    const clone = target.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.top = '-1000px';
    clone.style.opacity = '0.9';
    clone.style.transform = 'rotate(2deg)';
    document.body.appendChild(clone);
    e.dataTransfer.setDragImage(clone, 20, 20);
    setTimeout(() => document.body.removeChild(clone), 0);
    
    setDraggedIndex(index);
  }, [isEditMode]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isAbove = y < rect.height / 2;
    
    setDragOverIndex(index);
    setDropPosition(isAbove ? 'above' : 'below');
  }, [draggedIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!navRef.current?.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      let adjustedIndex = toIndex;
      if (dropPosition === 'below' && draggedIndex < toIndex) {
        adjustedIndex = toIndex;
      } else if (dropPosition === 'above' && draggedIndex > toIndex) {
        adjustedIndex = toIndex;
      } else if (dropPosition === 'below') {
        adjustedIndex = toIndex + 1;
      }
      
      onReorder(items, draggedIndex, Math.min(adjustedIndex, items.length - 1));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dropPosition, onReorder, items]);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Touch-based reordering
  const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setTouchDragIndex(index);
  }, [isEditMode]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchDragIndex === null || !isEditMode) return;
    e.stopPropagation();
    
    const touch = e.touches[0];
    
    for (let i = 0; i < itemRefs.current.length; i++) {
      const item = itemRefs.current[i];
      if (!item) continue;
      
      const rect = item.getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        if (i !== touchDragIndex) {
          const isAbove = touch.clientY < rect.top + rect.height / 2;
          setDragOverIndex(i);
          setDropPosition(isAbove ? 'above' : 'below');
        }
        break;
      }
    }
  }, [touchDragIndex, isEditMode]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchDragIndex === null) return;
    e.stopPropagation();
    
    if (dragOverIndex !== null && touchDragIndex !== dragOverIndex) {
      let adjustedIndex = dragOverIndex;
      if (dropPosition === 'below') {
        adjustedIndex = Math.min(dragOverIndex + 1, items.length - 1);
      }
      onReorder(items, touchDragIndex, adjustedIndex);
    }
    
    setTouchDragIndex(null);
    setDragOverIndex(null);
  }, [touchDragIndex, dragOverIndex, dropPosition, onReorder, items]);

  return {
    draggedIndex,
    dragOverIndex,
    dropPosition,
    touchDragIndex,
    navRef,
    itemRefs,
    handlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
      onDragEnd: handleDragEnd,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
