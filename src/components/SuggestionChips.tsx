import { cn } from '@/lib/utils';
import { defaultSuggestions, SuggestionChip } from '@/config/suggestions';

interface SuggestionChipsProps {
  onSelect: (prompt: string) => void;
  suggestions?: SuggestionChip[];
}

export const SuggestionChips = ({ onSelect, suggestions = defaultSuggestions }: SuggestionChipsProps) => {
  return (
    <div className="w-full overflow-x-auto scrollbar-hide scroll-snap-x -mx-4 px-4 md:mx-0 md:px-0 md:overflow-visible">
      <div className="flex md:flex-wrap md:justify-center gap-3 w-max md:w-full">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={suggestion.label}
              onClick={() => onSelect(suggestion.prompt)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium whitespace-nowrap scroll-snap-item touch-target",
                "bg-card/50 border-border text-muted-foreground",
                "hover:bg-primary/10 hover:text-foreground hover:border-primary/30",
                "active:scale-[0.98] active:bg-primary/20"
              )}
            >
              <Icon size={14} className="text-primary flex-shrink-0" />
              <span>{suggestion.label}</span>
            </button>
          );
        })}
      </div>
      {/* Gradient fade indicators for mobile */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
    </div>
  );
};
