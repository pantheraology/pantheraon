import { useState } from 'react';
import { Plus, BookMarked } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { usePrompts, SavedPrompt, CreatePromptData } from '@/hooks/usePrompts';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { CardSkeleton } from '@/components/common/LoadingSkeleton';
import { FeatureErrorBoundary } from '@/components/common/FeatureErrorBoundary';
import { PromptFormDialog } from '@/components/prompts/PromptFormDialog';
import { PromptCard } from '@/components/prompts/PromptCard';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';

const PromptbaseContent = () => {
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
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={handleOpenEdit}
                onDelete={setDeletePromptId}
              />
            ))}
          </div>
        )}
      </div>

      <PromptFormDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingPrompt={editingPrompt}
        formData={formData}
        onFormDataChange={setFormData}
        onSubmit={handleSubmit}
        isSubmitting={createPrompt.isPending || updatePrompt.isPending}
      />

      <DeleteConfirmDialog
        isOpen={!!deletePromptId}
        onOpenChange={() => setDeletePromptId(null)}
        onConfirm={handleDelete}
        title="Delete Prompt?"
        description="This action cannot be undone. This prompt will be permanently deleted."
      />
    </PageContainer>
  );
};

const Promptbase = () => (
  <FeatureErrorBoundary featureName="Promptbase">
    <PromptbaseContent />
  </FeatureErrorBoundary>
);

export default Promptbase;