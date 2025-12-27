import { Plus, Command } from 'lucide-react';

interface HeaderWidgetProps {
  onNewThread?: () => void;
}

export const HeaderWidget = ({ onNewThread }: HeaderWidgetProps) => {
  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 hidden md:flex items-center gap-12 px-4 py-2.5 glass rounded-lg">
      <button 
        onClick={onNewThread}
        className="flex items-center gap-2 hover:text-primary transition-colors"
      >
        <Plus size={14} className="text-foreground" />
        <span className="text-foreground text-sm font-medium">New Thread</span>
      </button>
      
      <div className="flex items-center gap-1.5">
        <div className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono flex items-center">
          <Command size={10} className="mr-0.5" />
          K
        </div>
        <div className="px-1.5 py-0.5 bg-muted rounded text-[10px] text-muted-foreground font-mono">
          I
        </div>
      </div>
    </div>
  );
};
