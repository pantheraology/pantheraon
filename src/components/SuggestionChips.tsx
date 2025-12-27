import { LayoutGrid, Compass, Heart, BookOpen, Trophy, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionChip {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

const suggestions: SuggestionChip[] = [
  { icon: LayoutGrid, label: 'Parenting', prompt: 'Give me some tips for better parenting' },
  { icon: Compass, label: 'Current Events', prompt: 'What are the latest news and current events?' },
  { icon: Heart, label: 'Health', prompt: 'Give me health and wellness advice' },
  { icon: BookOpen, label: 'Research', prompt: 'Help me research a topic' },
  { icon: Trophy, label: 'Sports', prompt: 'Tell me about recent sports news' },
];

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
}

export const SuggestionChips = ({ onSelect }: SuggestionChipsProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 w-full">
      {suggestions.map((suggestion) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={suggestion.label}
            onClick={() => onSelect(suggestion.prompt)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium",
              "bg-card/50 border-border text-muted-foreground",
              "hover:bg-primary/10 hover:text-foreground hover:border-primary/30"
            )}
          >
            <Icon size={14} className="text-primary" />
            <span>{suggestion.label}</span>
          </button>
        );
      })}
    </div>
  );
};
