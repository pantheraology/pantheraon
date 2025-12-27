import { cn } from '@/lib/utils';
import { defaultSuggestions, SuggestionChip } from '@/config/suggestions';

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
  suggestions?: SuggestionChip[];
}

export const SuggestionChips = ({ onSelect, suggestions = defaultSuggestions }: SuggestionChipsProps) => {
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
