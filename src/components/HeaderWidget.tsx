import { Plus } from 'lucide-react';

interface HeaderWidgetProps {
  onNewThread?: () => void;
}

export const HeaderWidget = ({ onNewThread }: HeaderWidgetProps) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center px-4 py-2.5 glass rounded-lg">
      <button 
        onClick={onNewThread}
        className="flex items-center gap-2 hover:text-primary transition-colors"
      >
        <Plus size={14} className="text-foreground" />
        <span className="text-foreground text-sm font-medium">New Chat</span>
      </button>
    </div>
  );
};
