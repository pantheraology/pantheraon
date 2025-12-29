import { useState, useEffect } from 'react';
import { useAgent } from '@/hooks/useAgent';
import { useAgents } from '@/hooks/useAgents';
import { AGENT_MODELS, AGENT_CAPABILITIES } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  FileText, 
  Cpu, 
  Zap, 
  ArrowLeft, 
  Save, 
  Plus, 
  X,
  Upload,
  Trash2,
  Loader2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface AgentBuilderProps {
  agentId: string;
  onBack: () => void;
}

export const AgentBuilder = ({ agentId, onBack }: AgentBuilderProps) => {
  const { updateAgent } = useAgents();
  const { 
    agent, 
    isLoading, 
    addConversationStarter, 
    removeConversationStarter,
    setModels,
    setCapabilities,
    uploadKnowledge,
    removeKnowledge,
  } = useAgent(agentId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [newStarter, setNewStarter] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Sync form with agent data
  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setDescription(agent.description || '');
      setInstructions(agent.instructions || '');
      setSelectedModels(agent.models.map(m => m.model_id));
      setSelectedCapabilities(agent.capabilities.map(c => c.capability));
    }
  }, [agent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAgent(agentId, { name, description, instructions });
      await setModels(selectedModels);
      await setCapabilities(selectedCapabilities);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddStarter = () => {
    if (newStarter.trim()) {
      addConversationStarter(newStarter.trim());
      setNewStarter('');
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Client-side file size validation
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
        e.target.value = '';
        return;
      }
      uploadKnowledge(file);
      e.target.value = '';
    }
  };

  const toggleModel = (modelId: string) => {
    setSelectedModels(prev => 
      prev.includes(modelId) 
        ? prev.filter(m => m !== modelId)
        : [...prev, modelId]
    );
  };

  const toggleCapability = (capabilityId: string) => {
    setSelectedCapabilities(prev => 
      prev.includes(capabilityId) 
        ? prev.filter(c => c !== capabilityId)
        : [...prev, capabilityId]
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Agent not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{agent.name}</h2>
              {agent.is_main && (
                <Badge variant="secondary" className="text-xs">Main Agent</Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-4xl mx-auto">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Basic
              </TabsTrigger>
              <TabsTrigger value="starters" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Starters
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="models" className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Models
              </TabsTrigger>
              <TabsTrigger value="capabilities" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Capabilities
              </TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Agent Identity
                  </CardTitle>
                  <CardDescription>
                    Define your agent's name and personality
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="My AI Assistant"
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="A helpful assistant that..."
                      className="bg-secondary border-border resize-none"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions</Label>
                    <Textarea
                      id="instructions"
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      placeholder="You are a helpful AI assistant. When responding, you should..."
                      className="bg-secondary border-border resize-none min-h-[200px]"
                      rows={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      These instructions define how your agent behaves and responds
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Conversation Starters */}
            <TabsContent value="starters" className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Conversation Starters
                  </CardTitle>
                  <CardDescription>
                    Suggested prompts users can click to start a conversation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newStarter}
                      onChange={(e) => setNewStarter(e.target.value)}
                      placeholder="Add a conversation starter..."
                      className="bg-secondary border-border"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddStarter()}
                    />
                    <Button onClick={handleAddStarter} disabled={!newStarter.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {agent.conversation_starters.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No conversation starters yet
                      </p>
                    ) : (
                      agent.conversation_starters.map((starter) => (
                        <div
                          key={starter.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <span className="text-sm text-foreground">{starter.prompt}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeConversationStarter(starter.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Knowledge */}
            <TabsContent value="knowledge" className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Knowledge Base
                  </CardTitle>
                  <CardDescription>
                    Upload files to give your agent specialized knowledge
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, TXT up to 10MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.md"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    {agent.knowledge.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No files uploaded yet
                      </p>
                    ) : (
                      agent.knowledge.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{file.file_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file_size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeKnowledge(file.id, file.file_path)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Models */}
            <TabsContent value="models" className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" />
                    Recommended Models
                  </CardTitle>
                  <CardDescription>
                    Select which AI models your agent can use. Leave empty for Auto Mode (all models available)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {AGENT_MODELS.map((model) => (
                      <div
                        key={model.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedModels.includes(model.id)
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-secondary/30 border-border hover:bg-secondary/50'
                        }`}
                        onClick={() => toggleModel(model.id)}
                      >
                        <Checkbox
                          checked={selectedModels.includes(model.id)}
                          onCheckedChange={() => toggleModel(model.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{model.name}</p>
                          <p className="text-sm text-muted-foreground">{model.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedModels.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Auto Mode: All models will be available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Capabilities */}
            <TabsContent value="capabilities" className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Capabilities
                  </CardTitle>
                  <CardDescription>
                    Enable specific capabilities for your agent. Leave empty for Auto Mode (all capabilities available)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AGENT_CAPABILITIES.map((capability) => (
                      <div
                        key={capability.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedCapabilities.includes(capability.id)
                            ? 'bg-primary/10 border-primary/50'
                            : 'bg-secondary/30 border-border hover:bg-secondary/50'
                        }`}
                        onClick={() => toggleCapability(capability.id)}
                      >
                        <Checkbox
                          checked={selectedCapabilities.includes(capability.id)}
                          onCheckedChange={() => toggleCapability(capability.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{capability.name}</p>
                          <p className="text-xs text-muted-foreground">{capability.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedCapabilities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Auto Mode: All capabilities will be available
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};
