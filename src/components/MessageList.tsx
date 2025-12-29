import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { User, Sparkles } from 'lucide-react';
import { Message } from '@/types';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto py-6 scrollbar-thin">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-4 animate-fade-in",
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}
          style={{ animationDelay: `${index * 0.05}s` }}
        >
          {/* Avatar */}
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            message.role === 'user' 
              ? "bg-primary/20 text-primary" 
              : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
          )}>
            {message.role === 'user' ? (
              <User size={16} />
            ) : (
              <Sparkles size={16} />
            )}
          </div>

          {/* Message Content */}
          <div className={cn(
            "flex-1 rounded-2xl px-4 py-3 max-w-[85%]",
            message.role === 'user' 
              ? "bg-primary/10 text-foreground ml-auto" 
              : "glass text-foreground"
          )}>
            {message.role === 'user' ? (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            ) : (
              <MarkdownRenderer content={message.content} />
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-4 animate-fade-in">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles size={16} className="text-primary-foreground animate-pulse" />
          </div>
          <div className="glass rounded-2xl px-4 py-3">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
