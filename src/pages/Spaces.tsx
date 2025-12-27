import { useState } from 'react';
import { Plus, FolderOpen, Trash2, MoreHorizontal } from 'lucide-react';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { useConversations, Space } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';

const Spaces = () => {
  const { spaces, conversations, createSpace, deleteSpace, getConversationsBySpace } = useConversations();
  const [newSpaceName, setNewSpaceName] = useState('');
  const [showNewSpace, setShowNewSpace] = useState(false);

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      createSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowNewSpace(false);
    }
  };

  return (
    <div className="relative flex-1 h-screen flex flex-col">
      <BackgroundEffects />

      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-10">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-light text-foreground mb-2">Spaces</h1>
              <p className="text-muted-foreground">Organize your conversations into workspaces</p>
            </div>
            
            <button 
              onClick={() => setShowNewSpace(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-primary to-primary/60 text-primary-foreground font-medium hover:brightness-110 transition-all"
            >
              <Plus size={18} />
              New Space
            </button>
          </div>

          {/* New Space Form */}
          {showNewSpace && (
            <div className="glass rounded-xl p-4 mb-6 animate-fade-in">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateSpace()}
                  placeholder="Enter space name..."
                  className="flex-1 bg-secondary/50 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  autoFocus
                />
                <button 
                  onClick={handleCreateSpace}
                  className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all"
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowNewSpace(false)}
                  className="px-4 py-2.5 rounded-lg bg-secondary text-foreground font-medium hover:bg-muted transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Spaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.length === 0 && !showNewSpace ? (
              <div className="col-span-full glass rounded-xl p-12 text-center">
                <FolderOpen size={48} className="mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No spaces yet</h3>
                <p className="text-muted-foreground mb-4">Create your first space to organize conversations</p>
                <button 
                  onClick={() => setShowNewSpace(true)}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all"
                >
                  Create Space
                </button>
              </div>
            ) : (
              spaces.map((space) => {
                const spaceConversations = getConversationsBySpace(space.id);
                return (
                  <SpaceCard 
                    key={space.id} 
                    space={space} 
                    conversationCount={spaceConversations.length}
                    onDelete={() => deleteSpace(space.id)}
                  />
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SpaceCardProps {
  space: Space;
  conversationCount: number;
  onDelete: () => void;
}

const SpaceCard = ({ space, conversationCount, onDelete }: SpaceCardProps) => {
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

export default Spaces;
