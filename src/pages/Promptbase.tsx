import { useState } from 'react';
import { Plus, Pencil, Trash2, BookMarked } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { usePrompts, SavedPrompt, CreatePromptData } from '@/hooks/usePrompts';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/common/EmptyState';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';

const Promptbase = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { prompts, isLoading, createPrompt, updatePrompt, deletePrompt } = usePrompts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<SavedPrompt | null>(null);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreatePromptData>({
    title: '',
    content: '',
    category: '',
  });

  if (isAuthLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton count={3} />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <AuthPrompt
          title="Sign in to access Promptbase"
          description="Save and organize your frequently used prompts for quick access"
        />
      </PageContainer>
    );
  }

  const handleOpenCreate = () => {
    setEditingPrompt(null);
    setFormData({ title: '', content: '', category: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (prompt: SavedPrompt) => {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      content: prompt.content,
      category: prompt.category || '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingPrompt) {
      await updatePrompt.mutateAsync({
        id: editingPrompt.id,
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category?.trim() || null,
      });
    } else {
      await createPrompt.mutateAsync({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category?.trim(),
      });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (deletePromptId) {
      await deletePrompt.mutateAsync(deletePromptId);
      setDeletePromptId(null);
    }
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Promptbase</h2>
            <p className="text-muted-foreground text-sm mt-1">
              {prompts.length} saved prompt{prompts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <Plus size={16} className="mr-2" />
            New Prompt
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <CardSkeleton count={3} />
          </div>
        ) : prompts.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No saved prompts"
            description="Create your first prompt to quickly access it from any chat"
            actionLabel="Create Prompt"
            onAction={handleOpenCreate}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="glass rounded-xl p-4 space-y-3 group hover:border-primary/30 transition-colors"
              >
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
                      onClick={() => handleOpenEdit(prompt)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletePromptId(prompt.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {prompt.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category (optional)</Label>
              <Input
                id="category"
                placeholder="e.g., Development"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Prompt Content</Label>
              <Textarea
                id="content"
                placeholder="Enter your prompt here..."
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.content.trim()}
            >
              {editingPrompt ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePromptId} onOpenChange={() => setDeletePromptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This prompt will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default Promptbase;
