import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { useConversations } from '@/hooks/useConversations';
import { ConversationCard } from '@/components/cards/ConversationCard';

const Library = () => {
  const { conversations, deleteConversation } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
            <div className="glass rounded-xl p-12 text-center">
              <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? 'No matching conversations' : 'No conversations yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Start a new conversation to see it here'
                }
              </p>
              {!searchQuery && (
                <Link 
                  to="/"
                  className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 transition-all"
                >
                  Start Chatting
                </Link>
              )}
            </div>
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
