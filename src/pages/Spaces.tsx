import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { SpaceCard } from '@/components/cards/SpaceCard';
import { AuthModal } from '@/components/AuthModal';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const Spaces = () => {
  const { spaces, createSpace, deleteSpace, getConversationsBySpace } = useConversations();
  const { isSignedIn, showAuthModal, requireAuth, closeAuthModal } = useAuthGuard();
  const [newSpaceName, setNewSpaceName] = useState('');
  const [showNewSpace, setShowNewSpace] = useState(false);

  const handleCreateSpace = () => {
    if (newSpaceName.trim()) {
      createSpace(newSpaceName.trim());
      setNewSpaceName('');
      setShowNewSpace(false);
    }
  };

  const handleNewSpaceClick = () => {
    requireAuth(() => {
      setShowNewSpace(true);
    });
  };

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-10">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-light text-foreground mb-2">Spaces</h1>
            <p className="text-muted-foreground">Organize your conversations into workspaces</p>
          </div>
          
          <button 
            onClick={handleNewSpaceClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-b from-primary to-primary/60 text-primary-foreground font-medium hover:brightness-110 transition-all"
          >
            <Plus size={18} />
            New Space
          </button>
        </div>

        {/* Sign in prompt for non-authenticated users */}
        {!isSignedIn && (
          <AuthPrompt
            title="Sign in to manage spaces"
            description="Sign in to create and manage your spaces"
          />
        )}

        {/* New Space Form */}
        {showNewSpace && isSignedIn && (
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
        {isSignedIn && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spaces.length === 0 && !showNewSpace ? (
              <div className="col-span-full">
                <EmptyState
                  icon={FolderOpen}
                  title="No spaces yet"
                  description="Create your first space to organize conversations"
                  actionLabel="Create Space"
                  onAction={() => setShowNewSpace(true)}
                />
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
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={closeAuthModal}
        message="Sign in to create and manage your spaces."
      />
    </div>
  );
};

export default Spaces;
