/**
 * Prompt Form Dialog Component
 * Reusable dialog for creating and editing prompts
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SavedPrompt, CreatePromptData } from '@/hooks/usePrompts';

interface PromptFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingPrompt: SavedPrompt | null;
  formData: CreatePromptData;
  onFormDataChange: (data: CreatePromptData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const PromptFormDialog = ({
  isOpen,
  onOpenChange,
  editingPrompt,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting = false,
}: PromptFormDialogProps) => {
  const isValid = formData.title.trim() && formData.content.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Code Review"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Development"
              value={formData.category}
              onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Prompt Content</Label>
            <Textarea
              id="content"
              placeholder="Enter your prompt here..."
              rows={6}
              value={formData.content}
              onChange={(e) => onFormDataChange({ ...formData, content: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
          >
            {editingPrompt ? 'Save Changes' : 'Create Prompt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
