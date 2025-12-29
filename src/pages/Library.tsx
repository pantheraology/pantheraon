import { useState } from 'react';
import { Search, MessageSquare, ChevronDown } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { ConversationCard } from '@/components/cards/ConversationCard';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';
import { PageContainer } from '@/components/layout/PageContainer';
import { ConversationSkeleton } from '@/components/common/LoadingSkeleton';
import { Button } from '@/components/ui/button';

const Library = () => {
  const { 
    conversations, 
    isLoading: conversationsLoading, 
    deleteConversation,
    hasMore,
    loadMore,
  } = useConversations();
  const { isSignedIn, isLoaded } = useAuthGuard();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadMore();
    setIsLoadingMore(false);
  };

  if (isLoaded && !isSignedIn) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">Library</h1>
          <p className="text-muted-foreground">Your conversation history</p>
        </div>

        <AuthPrompt
          title="Sign in to see your library"
          description="Your conversation history will be saved and accessible across devices"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
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
        {conversationsLoading ? (
          <ConversationSkeleton count={3} />
        ) : filteredConversations.length === 0 ? (
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
          <>
            {filteredConversations.map((conversation) => (
              <ConversationCard 
                key={conversation.id}
                conversation={conversation}
                onDelete={() => deleteConversation(conversation.id)}
              />
            ))}
            
            {/* Load More Button */}
            {hasMore && !searchQuery && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} />
                      Load More
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Library;
