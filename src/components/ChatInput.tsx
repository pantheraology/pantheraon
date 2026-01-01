import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Brain, Search, ChevronDown, Check, X, FileText, Mic, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMode, ChatAttachment, CHAT_MODELS } from '@/types';
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_DOC_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  isAcceptedImageType,
  isAcceptedDocType,
  ACCEPTED_FILE_TYPES,
} from '@/constants/files';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PromptbasePopover } from '@/components/chat/PromptbasePopover';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { triggerHaptic } from '@/hooks/useDeviceCapability';

// Re-export ChatAttachment for backward compatibility
export type { ChatAttachment } from '@/types';

interface ChatInputProps {
  onSend: (message: string, options?: { mode: ChatMode; model: string; attachments?: ChatAttachment[] }) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, isLoading = false, placeholder = "Message..." }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('normal');
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [showTools, setShowTools] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice input
  const { isListening, isSupported: voiceSupported, toggleListening, transcript } = useVoiceInput({
    onTranscript: (text) => {
      setInput(prev => prev ? `${prev} ${text}` : text);
      triggerHaptic('light');
    },
  });

  const handleSubmit = () => {
    if ((input.trim() || attachments.length > 0) && !isLoading) {
      onSend(input.trim(), { mode, model: selectedModel.id, attachments: attachments.length > 0 ? attachments : undefined });
      setInput('');
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File ${file.name} is too large (max ${MAX_FILE_SIZE_MB}MB)`);
        return;
      }

      const isImage = isAcceptedImageType(file.type);
      const isDoc = isAcceptedDocType(file.type);

      if (!isImage && !isDoc) {
        toast.error(`File type not supported: ${file.type}`);
        return;
      }

      const attachment: ChatAttachment = {
        file,
        type: isImage ? 'image' : 'document',
      };

      if (isImage) {
        const reader = new FileReader();
        reader.onload = (e) => {
          attachment.preview = e.target?.result as string;
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        setAttachments(prev => [...prev, attachment]);
      }
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleMode = (newMode: ChatMode) => {
    setMode(prev => prev === newMode ? 'normal' : newMode);
    triggerHaptic('light');
  };

  const handleSelectPrompt = (content: string) => {
    setInput(prev => prev ? `${prev}\n\n${content}` : content);
    inputRef.current?.focus();
  };

  // Auto-resize textarea with mobile-friendly max height
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const maxHeight = window.innerWidth < 768 ? 100 : 150;
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, maxHeight)}px`;
    }
  }, [input]);

  return (
    <TooltipProvider>
      <div className="w-full bg-muted/50 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-border/50 shadow-lg">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 md:p-3 border-b border-border/30">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group bg-background rounded-lg overflow-hidden"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-12 w-12 md:h-14 md:w-14 object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 md:h-14 md:w-14 flex items-center justify-center">
                    <FileText size={20} className="text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Main Input Row - Mobile optimized */}
        <div className="flex items-end gap-2 p-2 md:p-3">
          {/* Left: Expand tools button (mobile) / Attachment (desktop) */}
          <div className="flex items-center">
            {/* Mobile: Show expand button */}
            <button
              onClick={() => {
                setShowTools(!showTools);
                triggerHaptic('light');
              }}
              className="md:hidden p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Toggle tools"
            >
              <Plus size={20} className={cn("transition-transform", showTools && "rotate-45")} />
            </button>
            
            {/* Desktop: Show attachment directly */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleAttachment}
                  className="hidden md:flex p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  aria-label="Attach file"
                >
                  <Paperclip size={20} />
                </button>
              </TooltipTrigger>
              <TooltipContent>Attach file</TooltipContent>
            </Tooltip>
          </div>

          {/* Center: Textarea */}
          <textarea 
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            rows={1}
            className="flex-1 bg-transparent text-foreground text-sm md:text-base placeholder:text-muted-foreground/60 focus:outline-none py-2 font-normal resize-none min-h-[40px] max-h-[100px] md:max-h-[150px]"
          />

          {/* Right: Send button */}
          <button 
            onClick={() => {
              triggerHaptic('medium');
              handleSubmit();
            }}
            disabled={(!input.trim() && attachments.length === 0) || isLoading}
            className={cn(
              "shrink-0 h-9 w-9 md:h-10 md:w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-all",
              (input.trim() || attachments.length > 0) && !isLoading 
                ? "hover:bg-primary/90 active:scale-95" 
                : "opacity-40 cursor-not-allowed"
            )}
          >
            <Send size={16} className="md:w-[18px] md:h-[18px]" />
          </button>
        </div>

        {/* Tools Row - Collapsible on mobile, always visible on desktop */}
        <div className={cn(
          "overflow-hidden transition-all duration-200 border-t border-border/30",
          showTools ? "max-h-20" : "max-h-0 md:max-h-20"
        )}>
          <div className="flex items-center justify-between gap-1 px-2 md:px-3 py-2">
            {/* Left: Tools */}
            <div className="flex items-center gap-0.5 md:gap-1 overflow-x-auto">
              {/* Attachment (mobile only - shown in tools row) */}
              <button
                onClick={handleAttachment}
                className="md:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
                aria-label="Attach file"
              >
                <Paperclip size={18} />
              </button>

              {/* Voice Input */}
              {voiceSupported && (
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    toggleListening();
                  }}
                  className={cn(
                    "p-2 rounded-lg transition-all relative shrink-0",
                    isListening
                      ? "text-primary bg-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  aria-label={isListening ? "Stop listening" : "Voice input"}
                >
                  <Mic size={18} />
                  {isListening && (
                    <span className="absolute inset-0 rounded-lg border-2 border-primary animate-pulse" />
                  )}
                </button>
              )}

              {/* Research Mode */}
              <button
                onClick={() => toggleMode('research')}
                className={cn(
                  "p-2 rounded-lg transition-all shrink-0 flex items-center gap-1",
                  mode === 'research'
                    ? "text-primary bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label="Research mode"
              >
                <Search size={18} />
                {mode === 'research' && <span className="text-xs font-medium hidden sm:inline">Research</span>}
              </button>

              {/* Thinking Mode */}
              <button
                onClick={() => toggleMode('thinking')}
                className={cn(
                  "p-2 rounded-lg transition-all shrink-0 flex items-center gap-1",
                  mode === 'thinking'
                    ? "text-primary bg-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-label="Thinking mode"
              >
                <Brain size={18} />
                {mode === 'thinking' && <span className="text-xs font-medium hidden sm:inline">Thinking</span>}
              </button>

              {/* Promptbase - hidden on smallest screens */}
              <div className="hidden sm:block">
                <PromptbasePopover onSelectPrompt={handleSelectPrompt} />
              </div>
            </div>

            {/* Right: Model Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0">
                  <span className="max-w-[80px] sm:max-w-none truncate">{selectedModel.name}</span>
                  <ChevronDown size={12} className="shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
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
        </div>
      </div>
    </TooltipProvider>
  );
};
