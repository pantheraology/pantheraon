/**
 * Model Selector Component
 * Dropdown for selecting AI models in chat
 */

import { ChevronDown, Check } from 'lucide-react';
import { ModelOption } from '@/config/models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ModelSelectorProps {
  models: ModelOption[];
  selectedModel: ModelOption;
  onSelect: (model: ModelOption) => void;
}

export const ModelSelector = ({ models, selectedModel, onSelect }: ModelSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 h-8 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          {selectedModel.name}
          <ChevronDown size={14} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onSelect(model)}
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
  );
};
