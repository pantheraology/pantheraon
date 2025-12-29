import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAgents } from '@/hooks/useAgents';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, Plus, Search } from 'lucide-react';
import { CreateAgentDialog } from '@/components/agents/CreateAgentDialog';
import { AgentCard } from '@/components/agents/AgentCard';
import { AgentBuilder } from '@/components/agents/AgentBuilder';
import { GridSkeleton } from '@/components/common/LoadingSkeleton';
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

const Assistants = () => {
  const { isSignedIn, isLoaded } = useAuthGuard();
  const authLoading = !isLoaded;
  const { agents, isLoading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAgent, setEditingAgent] = useState<string | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<string | null>(null);

  // Filter out main agent - assistants are non-main agents
  const assistants = agents.filter(a => !a.is_main);

  // Show auth prompt if not signed in
  if (!authLoading && !isSignedIn) {
    return (
      <AuthPrompt
        title="Assistants"
        description="Sign in to create custom AI assistants for specific tasks."
      />
    );
  }

  // If editing an agent, show the builder
  if (editingAgent) {
    return (
      <PageContainer className="p-0">
        <div className="h-screen">
          <AgentBuilder
            agentId={editingAgent}
            onBack={() => setEditingAgent(null)}
          />
        </div>
      </PageContainer>
    );
  }

  const filteredAssistants = assistants.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (deletingAgent) {
      await deleteAgent(deletingAgent);
      setDeletingAgent(null);
    }
  };

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assistants</h1>
          <p className="text-muted-foreground mt-1">
            Create custom AI assistants for specific tasks
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Assistant
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* Content */}
      {isLoading || authLoading ? (
        <GridSkeleton count={3} />
      ) : filteredAssistants.length === 0 ? (
        <EmptyState
          icon={Bot}
          title={searchQuery ? 'No assistants found' : 'No assistants yet'}
          description={
            searchQuery
              ? 'Try a different search term'
              : 'Create custom assistants for specific tasks like writing, coding, or research'
          }
          actionLabel={!searchQuery ? 'Create Assistant' : undefined}
          onAction={!searchQuery ? () => setShowCreateDialog(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssistants.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => setEditingAgent(agent.id)}
              onSetMain={() => updateAgent(agent.id, { is_main: true })}
              onDelete={() => setDeletingAgent(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateAgent={createAgent}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingAgent} onOpenChange={() => setDeletingAgent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Assistant?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assistant
              and all its configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
};

export default Assistants;
