import { MessageSquare, Trash2, Clock } from 'lucide-react';
import { Conversation } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationCardProps {
  conversation: Conversation;
  onDelete: () => void;
}

export const ConversationCard = ({ conversation, onDelete }: ConversationCardProps) => {
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
