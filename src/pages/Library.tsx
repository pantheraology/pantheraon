import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Trash2, Clock, Search } from 'lucide-react';
import { BackgroundEffects } from '@/components/BackgroundEffects';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const Library = () => {
  const { conversations, deleteConversation } = useConversations();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="relative flex-1 h-screen flex flex-col">
      <BackgroundEffects />

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
    </div>
  );
};

interface ConversationCardProps {
  conversation: Conversation;
  onDelete: () => void;
}

const ConversationCard = ({ conversation, onDelete }: ConversationCardProps) => {
  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const preview = lastMessage?.content.slice(0, 100) || '';

  return (
    <div className="glass rounded-xl p-4 hover:border-primary/30 transition-all group">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
          <MessageSquare size={18} className="text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-foreground font-medium truncate mb-1">
                {conversation.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {preview}{preview.length >= 100 ? '...' : ''}
              </p>
            </div>

            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
            >
              <Trash2 size={16} className="text-destructive" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <Clock size={12} />
            <span>{formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}</span>
            <span className="text-border">•</span>
            <span>{conversation.messages.length} messages</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Library;
