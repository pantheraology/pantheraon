import { useState, useRef, useCallback } from 'react';
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
  const { orderedItems, reorderItems } = useNavOrder();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
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
    if (isEditMode) {
      e.preventDefault();
      return;
    }
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!isEditMode) return;
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIndex(index);
  }, [isEditMode]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderItems(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, reorderItems]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  // Filter items based on auth status and hidden flag
  const visibleItems = orderedItems.filter(item => (!item.requiresAuth || user) && !item.hidden);

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
          <nav className="flex flex-col gap-2 mt-8">
            {visibleItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;

              return (
                <div
                  key={item.path}
                  draggable={isEditMode}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative transition-all duration-200",
                    isDragging && "opacity-50",
                    isDragOver && "transform translate-y-1",
                    isEditMode && "cursor-grab active:cursor-grabbing animate-wobble"
                  )}
                  {...(!isEditMode ? longPressHandlers : {})}
                >
                  {/* Drop indicator */}
                  {isDragOver && draggedIndex !== index && (
                    <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
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
                      isEditMode && "pointer-events-none"
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
