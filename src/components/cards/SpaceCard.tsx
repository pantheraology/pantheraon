import { FolderOpen, Trash2, MoreHorizontal } from 'lucide-react';
import { Space } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SpaceCardProps {
  space: Space;
  conversationCount: number;
  onDelete: () => void;
}

export const SpaceCard = ({ space, conversationCount, onDelete }: SpaceCardProps) => {
  return (
    <div className="glass rounded-xl p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
          <FolderOpen size={20} />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1.5 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-all">
              <MoreHorizontal size={16} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 size={14} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-lg font-medium text-foreground mb-1">{space.name}</h3>
      <p className="text-sm text-muted-foreground">
        {conversationCount} conversation{conversationCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
};
