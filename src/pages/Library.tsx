import { useState } from 'react';
import { Search, MessageSquare } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { ConversationCard } from '@/components/cards/ConversationCard';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';

const Library = () => {
  const { conversations, deleteConversation } = useConversations();
  const { isSignedIn, isLoaded } = useAuthGuard();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoaded && !isSignedIn) {
    return (
      <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-light text-foreground mb-2">Library</h1>
            <p className="text-muted-foreground">Your conversation history</p>
          </div>

          <AuthPrompt
            title="Sign in to see your library"
            description="Your conversation history will be saved and accessible across devices"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">Library</h1>
          <p className="text-muted-foreground">Your conversation history</p>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-secondary/50 border border-border rounded-xl pl-11 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-3">
          {filteredConversations.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={searchQuery ? 'No matching conversations' : 'No conversations yet'}
              description={
                searchQuery
                  ? 'Try a different search term'
                  : 'Start a new conversation to see it here'
              }
              actionLabel={searchQuery ? undefined : 'Start Chatting'}
              actionPath={searchQuery ? undefined : '/'}
            />
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationCard 
                key={conversation.id}
                conversation={conversation}
                onDelete={() => deleteConversation(conversation.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Library;
