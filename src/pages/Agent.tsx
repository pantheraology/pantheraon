import { useState } from 'react';
import { PageContainer } from '@/components/layout/PageContainer';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { EmptyState } from '@/components/common/EmptyState';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAgents } from '@/hooks/useAgents';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Sparkles, Settings2 } from 'lucide-react';
import { CreateAgentDialog } from '@/components/agents/CreateAgentDialog';
import { AgentBuilder } from '@/components/agents/AgentBuilder';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const Agent = () => {
  const { isSignedIn, isLoaded } = useAuthGuard();
  const authLoading = !isLoaded;
  const { mainAgent, isLoading, createAgent, updateAgent, deleteAgent } = useAgents();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string | null>(null);

  // Show auth prompt if not signed in
  if (!authLoading && !isSignedIn) {
    return (
      <AuthPrompt
        title="Your AI Agent"
        description="Sign in to create and customize your personal AI agent."
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

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {mainAgent ? mainAgent.name : 'AGENT'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {mainAgent ? 'Your personal AI agent' : 'Create your main AI agent'}
        </p>
      </div>

      {/* Content */}
      {isLoading || authLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-lg" />
        </div>
      ) : !mainAgent ? (
        // No main agent - show creation prompt
        <Card className="bg-card/50 border-border max-w-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Bot className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl">Create Your Main Agent</CardTitle>
            <CardDescription>
              Build a personalized AI agent with custom instructions, knowledge, and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-left">
              <div className="p-4 rounded-lg bg-secondary/30">
                <Sparkles className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-medium text-foreground">Custom Instructions</h4>
                <p className="text-sm text-muted-foreground">Define how your agent behaves</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <Bot className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-medium text-foreground">Knowledge Base</h4>
                <p className="text-sm text-muted-foreground">Upload files for context</p>
              </div>
              <div className="p-4 rounded-lg bg-secondary/30">
                <Settings2 className="h-6 w-6 text-primary mb-2" />
                <h4 className="font-medium text-foreground">Capabilities</h4>
                <p className="text-sm text-muted-foreground">Enable specific abilities</p>
              </div>
            </div>
            <Button size="lg" onClick={() => setShowCreateDialog(true)}>
              <Bot className="mr-2 h-5 w-5" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        // Main agent exists - show details and edit option
        <Card className="bg-card/50 border-border max-w-2xl">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-2xl">{mainAgent.name}</CardTitle>
                    <Badge variant="secondary">Main Agent</Badge>
                  </div>
                  <CardDescription>
                    Updated {formatDistanceToNow(new Date(mainAgent.updated_at), { addSuffix: true })}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" onClick={() => setEditingAgent(mainAgent.id)}>
                <Settings2 className="mr-2 h-4 w-4" />
                Configure
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {mainAgent.description && (
              <p className="text-muted-foreground mb-4">{mainAgent.description}</p>
            )}
            {mainAgent.instructions && (
              <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                <h4 className="text-sm font-medium text-foreground mb-2">Instructions</h4>
                <p className="text-sm text-muted-foreground line-clamp-4">
                  {mainAgent.instructions}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <CreateAgentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreateAgent={createAgent}
        isMainAgentSlot={true}
      />
    </PageContainer>
  );
};

export default Agent;
