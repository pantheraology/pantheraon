import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, isLoading = false, placeholder = "Ask anything..." }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <div className="w-full glass rounded-2xl p-4 flex flex-col gap-4 shadow-2xl">
      {/* Input Area */}
      <div className="relative">
        <textarea 
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          rows={1}
          className="w-full bg-transparent text-foreground text-lg placeholder:text-muted-foreground/50 focus:outline-none px-2 py-4 font-light resize-none min-h-[60px] max-h-[150px]"
        />
        
        <div className="flex items-center justify-between mt-2 border-t border-border pt-3">
          <div /> {/* Placeholder for future attachment feature */}

          <button 
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className={cn(
              "w-10 h-10 rounded-full bg-gradient-to-b from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg transition-all",
              input.trim() && !isLoading ? "hover:brightness-110" : "opacity-50 cursor-not-allowed"
            )}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
