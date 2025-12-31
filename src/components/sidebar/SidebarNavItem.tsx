/**
 * Sidebar Navigation Item Component
 * Handles individual nav item rendering with drag support
 */

import { Link } from 'react-router-dom';
import { LucideIcon, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarNavItemProps {
  item: {
    path: string;
    label: string;
    icon: LucideIcon;
  };
  isActive: boolean;
  isEditMode: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  dropPosition: 'above' | 'below';
  isPressing: boolean;
  onClick: (e: React.MouseEvent) => void;
}

export const SidebarNavItem = ({
  item,
  isActive,
  isEditMode,
  isDragging,
  isDragOver,
  dropPosition,
  isPressing,
  onClick,
}: SidebarNavItemProps) => {
  const Icon = item.icon;

  return (
    <>
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
        onClick={onClick}
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
    </>
  );
};
