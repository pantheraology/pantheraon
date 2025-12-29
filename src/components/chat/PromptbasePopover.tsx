import { BookMarked, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePrompts } from '@/hooks/usePrompts';
import { useAuth } from '@/contexts/AuthContext';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface PromptbasePopoverProps {
  onSelectPrompt: (content: string) => void;
}

export const PromptbasePopover = ({ onSelectPrompt }: PromptbasePopoverProps) => {
  const { user } = useAuth();
  const { prompts, isLoading } = usePrompts();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors opacity-50 cursor-not-allowed"
            disabled
          >
            <BookMarked size={18} />
          </button>
        </TooltipTrigger>
        <TooltipContent>Sign in to use Promptbase</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              aria-label="Promptbase"
            >
              <BookMarked size={18} />
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Promptbase</TooltipContent>
      </Tooltip>

      <PopoverContent align="start" className="w-72 p-0">
        <div className="p-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Saved Prompts</h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => navigate('/promptbase')}
            >
              <Plus size={14} className="mr-1" />
              Manage
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-64">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading...
            </div>
          ) : prompts.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">No saved prompts yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/promptbase')}
              >
                <Plus size={14} className="mr-1" />
                Create your first prompt
              </Button>
            </div>
          ) : (
            <div className="p-1">
              {prompts.map((prompt) => (
                <button
                  key={prompt.id}
                  onClick={() => onSelectPrompt(prompt.content)}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="font-medium text-sm truncate">{prompt.title}</div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {prompt.content.slice(0, 60)}...
                  </div>
                  {prompt.category && (
                    <span className="text-xs text-primary/70 mt-1 inline-block">
                      {prompt.category}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
