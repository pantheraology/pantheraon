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
    <div className="flex flex-col gap-3 md:gap-4 w-full py-4 md:py-6">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-2 md:gap-3 animate-fade-in",
            message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
          )}
          style={{ animationDelay: `${index * 0.03}s` }}
        >
          {/* Avatar - smaller on mobile */}
          <div className={cn(
            "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0",
            message.role === 'user' 
              ? "bg-primary/20 text-primary" 
              : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
          )}>
            {message.role === 'user' ? (
              <User size={14} className="md:w-4 md:h-4" />
            ) : (
              <Sparkles size={14} className="md:w-4 md:h-4" />
            )}
          </div>

          {/* Message Content - chat bubble style */}
          <div className={cn(
            "rounded-2xl px-3 py-2 md:px-4 md:py-3 max-w-[80%]",
            message.role === 'user' 
              ? "bg-primary text-primary-foreground" 
              : "bg-muted/80 text-foreground"
          )}>
            {message.role === 'user' ? (
              <p className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">{message.content}</p>
            ) : (
              <div className="text-sm md:text-base">
                <MarkdownRenderer content={message.content} />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex gap-2 md:gap-3 animate-fade-in">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="md:w-4 md:h-4 text-primary-foreground animate-pulse" />
          </div>
          <div className="bg-muted/80 rounded-2xl px-3 py-2 md:px-4 md:py-3">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
