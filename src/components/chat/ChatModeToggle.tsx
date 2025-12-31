/**
 * Chat Mode Toggle Component
 * Button for toggling research and thinking modes
 */

import { Brain, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMode } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ChatModeToggleProps {
  mode: ChatMode;
  onToggle: (mode: ChatMode) => void;
}

export const ChatModeToggle = ({ mode, onToggle }: ChatModeToggleProps) => {
  return (
    <>
      {/* Research Mode */}
      {mode === 'research' ? (
        <button
          onClick={() => onToggle('research')}
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
              onClick={() => onToggle('research')}
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-target"
              aria-label="Enable Research mode"
            >
              <Search size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Research mode</TooltipContent>
        </Tooltip>
      )}

      {/* Thinking Mode */}
      {mode === 'thinking' ? (
        <button
          onClick={() => onToggle('thinking')}
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
              onClick={() => onToggle('thinking')}
              className="p-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors touch-target"
              aria-label="Enable Thinking mode"
            >
              <Brain size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent>Thinking mode</TooltipContent>
        </Tooltip>
      )}
    </>
  );
};
