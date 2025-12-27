import { useState } from 'react';
import { FolderOpen, Trash2, MoreHorizontal } from 'lucide-react';
import { Space } from '@/types';

interface SpaceCardProps {
  space: Space;
  conversationCount: number;
  onDelete: () => void;
}

export const SpaceCard = ({ space, conversationCount, onDelete }: SpaceCardProps) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="glass rounded-xl p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground">
          <FolderOpen size={20} />
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-lg hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
          >
            <MoreHorizontal size={16} className="text-muted-foreground" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 glass rounded-lg py-1 min-w-[120px] z-10">
              <button 
                onClick={onDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-medium text-foreground mb-1">{space.name}</h3>
      <p className="text-sm text-muted-foreground">
        {conversationCount} conversation{conversationCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
};
