/**
 * Sidebar Edit Mode Header Component
 */

import { Check } from 'lucide-react';

interface SidebarEditModeProps {
  onDone: () => void;
}

export const SidebarEditMode = ({ onDone }: SidebarEditModeProps) => {
  return (
    <div className="flex items-center justify-between px-2 py-2 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
      <span className="text-sm text-primary font-medium">Drag to reorder</span>
      <button
        onClick={onDone}
        className="flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 transition-colors"
      >
        <Check size={12} />
        Done
      </button>
    </div>
  );
};
