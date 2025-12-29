import { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { SIDEBAR_WIDTH } from '@/constants/layout';
import { BRAND } from '@/config/brand';
import { UserAccountMenu } from '@/components/UserAccountMenu';
import { useLongPress } from '@/hooks/useLongPress';
import { useNavOrder } from '@/hooks/useNavOrder';
import { GripVertical, Check } from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

export const Sidebar = ({
  isOpen = true,
  isMobile = false,
  onClose
}: SidebarProps) => {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { orderedItems, reorderVisibleItems } = useNavOrder();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'above' | 'below'>('above');
  
  // Touch drag state
  const [touchDragIndex, setTouchDragIndex] = useState<number | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  
  const { handlers: longPressHandlers } = useLongPress({
    onLongPress: () => {
      setIsEditMode(true);
      setIsPressing(false);
    },
    duration: 2000,
    onStart: () => setIsPressing(true),
    onCancel: () => setIsPressing(false),
  });

  const handleNavClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditMode) {
      e.preventDefault();
      return;
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Filter items based on auth status and hidden flag
  const visibleItems = orderedItems.filter(item => (!item.requiresAuth || user) && !item.hidden);

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
    
    // Calculate if cursor is in top or bottom half of element
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const isAbove = y < rect.height / 2;
    
    setDragOverIndex(index);
    setDropPosition(isAbove ? 'above' : 'below');
  }, [draggedIndex]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    // Only clear if leaving the nav area entirely
    const relatedTarget = e.relatedTarget as Node;
    if (!navRef.current?.contains(relatedTarget)) {
      setDragOverIndex(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      // Adjust target index based on drop position
      let adjustedIndex = toIndex;
      if (dropPosition === 'below' && draggedIndex < toIndex) {
        adjustedIndex = toIndex;
      } else if (dropPosition === 'above' && draggedIndex > toIndex) {
        adjustedIndex = toIndex;
      } else if (dropPosition === 'below') {
        adjustedIndex = toIndex + 1;
      }
      
      // Use the visible items aware reorder
      reorderVisibleItems(visibleItems, draggedIndex, Math.min(adjustedIndex, visibleItems.length - 1));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, dropPosition, reorderVisibleItems, visibleItems]);

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
    
    // Find which item we're over
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
        adjustedIndex = Math.min(dragOverIndex + 1, visibleItems.length - 1);
      }
      reorderVisibleItems(visibleItems, touchDragIndex, adjustedIndex);
    }
    
    setTouchDragIndex(null);
    setDragOverIndex(null);
  }, [touchDragIndex, dragOverIndex, dropPosition, reorderVisibleItems, visibleItems]);

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 md:hidden" 
          onClick={onClose} 
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "h-screen bg-sidebar flex flex-col justify-between py-6 px-4 fixed left-0 top-0 z-40 border-r border-border/50 transition-transform duration-300 ease-in-out",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0"
        )} 
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-primary/80 via-primary to-primary/60 shadow-[0_0_38px_hsl(var(--primary)/0.45)] flex items-center justify-center text-foreground font-bold">
              P
            </div>
            <span className="text-foreground font-medium text-lg tracking-wide">{BRAND.APP_NAME}</span>
          </div>

          {/* Edit Mode Header */}
          {isEditMode && (
            <div className="flex items-center justify-between px-2 py-2 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
              <span className="text-sm text-primary font-medium">Drag to reorder</span>
              <button
                onClick={() => setIsEditMode(false)}
                className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                <Check size={12} />
                Done
              </button>
            </div>
          )}

          {/* Navigation */}
          <nav 
            ref={navRef}
            className="flex flex-col gap-1 mt-8"
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {visibleItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const isDragging = draggedIndex === index || touchDragIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index && touchDragIndex !== index;

              return (
                <div
                  key={item.path}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  className={cn(
                    "relative transition-all duration-200 ease-out",
                    isDragging && "opacity-50 scale-[0.98] z-50",
                    isDragOver && dropPosition === 'below' && "translate-y-1",
                    isDragOver && dropPosition === 'above' && "-translate-y-1",
                    isEditMode && "cursor-grab active:cursor-grabbing animate-wobble",
                    isEditMode && "touch-none" // Prevent scroll interference
                  )}
                  {...(!isEditMode ? longPressHandlers : {})}
                >
                  {/* Drop indicator - above */}
                  {isDragOver && dropPosition === 'above' && (
                    <div className="absolute -top-1 left-2 right-2 h-0.5 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                  
                  {/* Drop indicator - below */}
                  {isDragOver && dropPosition === 'below' && (
                    <div className="absolute -bottom-1 left-2 right-2 h-0.5 bg-primary rounded-full shadow-[0_0_8px_hsl(var(--primary))]" />
                  )}
                  
                  <Link
                    to={item.path}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-[radial-gradient(85.38%_270.12%_at_0%_50%,hsl(var(--primary))_0%,hsl(var(--primary)/0.7)_35%,hsl(var(--primary)/0.4)_75%,hsl(var(--primary)/0.25)_100%)] text-foreground shadow-lg"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      isPressing && !isEditMode && "scale-[0.98] transition-transform",
                      isEditMode && "pointer-events-none",
                      isDragging && "ring-2 ring-primary/50 bg-muted/50"
                    )}
                  >
                    {isEditMode && (
                      <GripVertical size={14} className="text-muted-foreground shrink-0" />
                    )}
                    <Icon size={18} />
                    <span className="font-medium text-[15px]">{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>
          
          {/* Long press hint */}
          {!isEditMode && (
            <p className="text-[10px] text-muted-foreground/50 text-center px-2">
              Hold item 2s to reorder
            </p>
          )}
        </div>

        {/* Bottom Section */}
        <div className="flex-col gap-4 flex items-center justify-start">
          {/* Auth Buttons or User Menu */}
          {isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-10 bg-muted/50 rounded-lg" />
              <div className="h-10 bg-muted/50 rounded-lg" />
            </div>
          ) : user ? (
            <UserAccountMenu />
          ) : (
            <>
              <Link 
                to="/auth" 
                onClick={handleNavClick} 
                className="w-full py-2.5 rounded-lg bg-gradient-to-b from-primary to-primary/60 text-primary-foreground font-medium text-[15px] shadow-lg hover:brightness-110 transition-all text-center block"
              >
                Sign up
              </Link>

              <Link 
                to="/auth" 
                onClick={handleNavClick} 
                className="w-full py-2.5 rounded-lg bg-muted/50 border border-border text-foreground font-medium text-[15px] hover:bg-muted transition-all text-center block"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};
