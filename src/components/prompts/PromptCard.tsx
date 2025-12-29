/**
 * Prompt Card Component
 * Displays a single saved prompt with actions
 */

import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SavedPrompt } from '@/hooks/usePrompts';

interface PromptCardProps {
  prompt: SavedPrompt;
  onEdit: (prompt: SavedPrompt) => void;
  onDelete: (id: string) => void;
}

export const PromptCard = ({ prompt, onEdit, onDelete }: PromptCardProps) => {
  return (
    <div className="glass rounded-xl p-4 space-y-3 group hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{prompt.title}</h3>
          {prompt.category && (
            <span className="text-xs text-primary/70">{prompt.category}</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onEdit(prompt)}
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(prompt.id)}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">
        {prompt.content}
      </p>
    </div>
  );
};
