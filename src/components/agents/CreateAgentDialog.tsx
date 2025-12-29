import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAgent: (name: string, isMain: boolean, description?: string, instructions?: string) => Promise<any>;
  isMainAgentSlot?: boolean;
}

export const CreateAgentDialog = ({
  open,
  onOpenChange,
  onCreateAgent,
  isMainAgentSlot = false,
}: CreateAgentDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isMain, setIsMain] = useState(isMainAgentSlot);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    const result = await onCreateAgent(
      name.trim(), 
      isMain,
      description.trim() || undefined,
      instructions.trim() || undefined
    );
    setIsCreating(false);

    if (result) {
      setName('');
      setDescription('');
      setInstructions('');
      setIsMain(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {isMainAgentSlot ? 'Create Your Main Agent' : 'Create New Agent'}
          </DialogTitle>
          <DialogDescription>
            {isMainAgentSlot 
              ? 'Your main agent will be your primary AI assistant'
              : 'Create a new AI agent with custom instructions'
            }
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="My AI Assistant"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A helpful assistant that..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (optional)</Label>
            <Textarea
              id="instructions"
              placeholder="You are a helpful AI assistant..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="bg-secondary border-border resize-none"
              rows={4}
            />
          </div>
          {!isMainAgentSlot && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isMain"
                checked={isMain}
                onCheckedChange={(checked) => setIsMain(checked === true)}
              />
              <Label htmlFor="isMain" className="text-sm font-normal">
                Set as main agent
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Agent'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
