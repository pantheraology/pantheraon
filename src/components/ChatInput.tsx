import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Brain, Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMode, CHAT_MODELS } from '@/types';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Toggle } from '@/components/ui/toggle';

interface ChatInputProps {
  onSend: (message: string, options?: { mode: ChatMode; model: string }) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, isLoading = false, placeholder = "Ask anything..." }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('normal');
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0]);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim(), { mode, model: selectedModel.id });
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAttachment = () => {
    toast.info('File attachments coming soon!');
  };

  const toggleMode = (newMode: ChatMode) => {
    setMode(prev => prev === newMode ? 'normal' : newMode);
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
        
        <div className="flex items-center justify-between mt-2 border-t border-border pt-3 gap-2">
          {/* Left side: Attachment and Modes */}
          <div className="flex items-center gap-2">
            {/* Attachment */}
            <button
              onClick={handleAttachment}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </button>

            {/* Research Mode */}
            <Toggle
              pressed={mode === 'research'}
              onPressedChange={() => toggleMode('research')}
              className={cn(
                "px-3 py-1.5 h-8 rounded-lg text-sm font-medium gap-1.5",
                mode === 'research' 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Toggle Research mode"
            >
              <Search size={14} />
              Research
            </Toggle>

            {/* Thinking Mode */}
            <Toggle
              pressed={mode === 'thinking'}
              onPressedChange={() => toggleMode('thinking')}
              className={cn(
                "px-3 py-1.5 h-8 rounded-lg text-sm font-medium gap-1.5",
                mode === 'thinking' 
                  ? "bg-primary/20 text-primary border border-primary/30" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Toggle Thinking mode"
            >
              <Brain size={14} />
              Thinking
            </Toggle>

            {/* Model Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                  {selectedModel.name}
                  <ChevronDown size={14} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {CHAT_MODELS.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">{model.description}</span>
                    </div>
                    {selectedModel.id === model.id && <Check size={16} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Right side: Send */}
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
