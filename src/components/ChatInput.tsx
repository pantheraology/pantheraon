import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Brain, Search, ChevronDown, Check, X, FileText, Mic } from 'lucide-react';
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

export const ChatInput = ({ onSend, isLoading = false, placeholder = "Ask anything..." }: ChatInputProps) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('normal');
  const [selectedModel, setSelectedModel] = useState(CHAT_MODELS[0]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
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
  };

  const handleSelectPrompt = (content: string) => {
    setInput(prev => prev ? `${prev}\n\n${content}` : content);
    inputRef.current?.focus();
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <TooltipProvider>
      <div className="w-full glass rounded-2xl p-4 flex flex-col gap-4 shadow-2xl">
        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="relative group bg-muted rounded-lg overflow-hidden"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="h-16 w-16 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center">
                    <FileText size={24} className="text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate">
                  {attachment.file.name}
                </div>
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
            {/* Left side: Attachment, Voice, Modes, and Promptbase */}
            <div className="flex items-center gap-1">
              {/* Attachment */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleAttachment}
                    className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-target"
                    aria-label="Attach file"
                  >
                    <Paperclip size={20} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>

              {/* Voice Input */}
              {voiceSupported && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        triggerHaptic('medium');
                        toggleListening();
                      }}
                      className={cn(
                        "p-2.5 rounded-lg transition-all touch-target relative",
                        isListening
                          ? "text-primary bg-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                      aria-label={isListening ? "Stop listening" : "Voice input"}
                    >
                      <Mic size={20} />
                      {isListening && (
                        <span className="absolute inset-0 rounded-lg border-2 border-primary animate-pulse-ring" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>{isListening ? "Listening..." : "Voice input"}</TooltipContent>
                </Tooltip>
              )}

              {/* Research Mode - Icon only when unselected, icon + text when selected */}
              {mode === 'research' ? (
                <button
                  onClick={() => toggleMode('research')}
                  className="px-3 py-1.5 h-10 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 transition-all touch-target"
                  aria-label="Research mode active"
                >
                  <Search size={18} />
                  <span className="hidden sm:inline">Research</span>
                </button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleMode('research')}
                      className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-target"
                      aria-label="Enable Research mode"
                    >
                      <Search size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Research mode</TooltipContent>
                </Tooltip>
              )}

              {/* Thinking Mode - Icon only when unselected, icon + text when selected */}
              {mode === 'thinking' ? (
                <button
                  onClick={() => toggleMode('thinking')}
                  className="px-3 py-1.5 h-10 rounded-lg text-sm font-medium flex items-center gap-1.5 bg-primary/20 text-primary border border-primary/30 transition-all touch-target"
                  aria-label="Thinking mode active"
                >
                  <Brain size={18} />
                  <span className="hidden sm:inline">Thinking</span>
                </button>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleMode('thinking')}
                      className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-target"
                      aria-label="Enable Thinking mode"
                    >
                      <Brain size={20} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Thinking mode</TooltipContent>
                </Tooltip>
              )}

              {/* Promptbase */}
              <PromptbasePopover onSelectPrompt={handleSelectPrompt} />
            </div>

            {/* Right side: Model Selector and Send */}
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                    {selectedModel.name}
                    <ChevronDown size={14} />
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

              {/* Send Button - Touch-friendly */}
              <button 
                onClick={() => {
                  triggerHaptic('medium');
                  handleSubmit();
                }}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
                className={cn(
                  "h-11 w-11 md:w-auto md:px-5 rounded-xl bg-gradient-to-b from-primary to-primary/60 flex items-center justify-center text-primary-foreground shadow-lg transition-all touch-target",
                  (input.trim() || attachments.length > 0) && !isLoading 
                    ? "hover:brightness-110 active:scale-95" 
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
