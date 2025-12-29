import { useState } from 'react';
import { Key, Eye, EyeOff, Trash2, Loader2, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useApiKeys } from '@/hooks/useApiKeys';
import { ApiKeyProvider } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProviderConfig {
  id: ApiKeyProvider;
  name: string;
  description: string;
  placeholder: string;
  docsUrl: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Use GPT models directly with your own API key',
    placeholder: 'sk-...',
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Use Claude models with your own API key',
    placeholder: 'sk-ant-...',
    docsUrl: 'https://console.anthropic.com/settings/keys',
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Use Gemini models with your own API key',
    placeholder: 'AIza...',
    docsUrl: 'https://aistudio.google.com/apikey',
  },
];

export const ApiKeysSection = () => {
  const { apiKeys, isLoading, saveApiKey, deleteApiKey, toggleApiKey, getApiKey } = useApiKeys();
  const [editingProvider, setEditingProvider] = useState<ApiKeyProvider | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (provider: ApiKeyProvider) => {
    if (!inputValue.trim()) return;

    setIsSaving(true);
    const { error } = await saveApiKey(provider, inputValue.trim());
    setIsSaving(false);

    if (!error) {
      setEditingProvider(null);
      setInputValue('');
    }
  };

  const handleDelete = async (provider: ApiKeyProvider) => {
    await deleteApiKey(provider);
  };

  const handleToggle = async (provider: ApiKeyProvider, isActive: boolean) => {
    await toggleApiKey(provider, isActive);
  };

  const startEditing = (provider: ApiKeyProvider) => {
    setEditingProvider(provider);
    setInputValue('');
  };

  const cancelEditing = () => {
    setEditingProvider(null);
    setInputValue('');
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">API Keys</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Add your own API keys to use LLM providers directly. When active, your keys will be used instead of the built-in service.
        </p>
      </div>

      <div className="space-y-4">
        {PROVIDERS.map((provider) => {
          const existingKey = getApiKey(provider.id);
          const isEditing = editingProvider === provider.id;

          return (
            <div
              key={provider.id}
              className="p-4 rounded-xl border border-border bg-card/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Key size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{provider.name}</h4>
                      <a
                        href={provider.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground">{provider.description}</p>
                  </div>
                </div>

                {existingKey && !isEditing && (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={existingKey.is_active}
                      onCheckedChange={(checked) => handleToggle(provider.id, checked)}
                    />
                  </div>
                )}
              </div>

              {/* Existing key display */}
              {existingKey && !isEditing && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 font-mono text-sm">
                    <span className="text-muted-foreground">
                      {showKey[provider.id] ? existingKey.api_key : maskKey(existingKey.api_key)}
                    </span>
                    <button
                      onClick={() => setShowKey(prev => ({ ...prev, [provider.id]: !prev[provider.id] }))}
                      className="p-1 hover:bg-muted rounded transition-colors"
                    >
                      {showKey[provider.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => startEditing(provider.id)}>
                    Update
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove your {provider.name} API key. You'll need to add it again to use your own key.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(provider.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Add/Edit form */}
              {(isEditing || !existingKey) && (
                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`${provider.id}-key`}>API Key</Label>
                    <Input
                      id={`${provider.id}-key`}
                      type="password"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={provider.placeholder}
                      className="font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(provider.id)}
                      disabled={!inputValue.trim() || isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Check size={14} className="mr-2" />
                      )}
                      Save Key
                    </Button>
                    {isEditing && (
                      <Button variant="ghost" size="sm" onClick={cancelEditing}>
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Your API keys are stored securely and never shared. When active, requests will be made directly to the provider using your key.
      </p>
    </div>
  );
};
