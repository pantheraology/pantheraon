import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useStudioGenerations } from '@/hooks/useStudioGenerations';
import { GenerationCard } from './GenerationCard';
import { ImagePreviewModal } from './ImagePreviewModal';
import { Wand2, Loader2, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square', icon: '⬜' },
  { value: '16:9', label: 'Landscape', icon: '🖼️' },
  { value: '9:16', label: 'Portrait', icon: '📱' },
];

const TIMEOUT_MS = 120000; // 2 minute timeout for image generation

export const ImageStudio = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { generations, isLoading, deleteGeneration, addGeneration } = useStudioGenerations('image');
  
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; prompt: string } | null>(null);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<Date | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      toast({
        title: 'Cancelled',
        description: 'Image generation was cancelled',
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a description for your image',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to generate images',
        variant: 'destructive',
      });
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setIsGenerating(true);

    // Setup timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        toast({
          title: 'Request timed out',
          description: 'Image generation took too long. Please try again.',
          variant: 'destructive',
        });
      }
    }, TIMEOUT_MS);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/studio-image`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({ prompt: prompt.trim(), aspectRatio }),
          signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          const retryAt = new Date(Date.now() + retrySeconds * 1000);
          setRateLimitRetryAt(retryAt);
          
          throw new Error(`Rate limit exceeded. Please wait ${retrySeconds} seconds and try again at ${retryAt.toLocaleTimeString()}.`);
        }
        if (response.status === 402) {
          throw new Error('Usage limit reached. Please add credits to continue.');
        }
        
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json();
      
      toast({
        title: 'Image generated!',
        description: 'Your image has been created successfully',
      });

      // Refetch to get the new generation from DB
      // For now, we'll just show the image
      if (data.imageUrl) {
        setPreviewImage({ url: data.imageUrl, prompt: prompt.trim() });
      }
      
      setPrompt('');
      setRateLimitRetryAt(null);
      
      // Add to local state optimistically
      if (!data.isBase64) {
        addGeneration({
          id: crypto.randomUUID(),
          user_id: user.id,
          type: 'image',
          prompt: prompt.trim(),
          result_url: data.imageUrl,
          settings: { aspectRatio },
          created_at: new Date().toISOString(),
        });
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled - don't show error (already handled)
        console.log('Image generation cancelled');
      } else {
        console.error('Generation error:', error);
        toast({
          title: 'Generation failed',
          description: error instanceof Error ? error.message : 'Something went wrong',
          variant: 'destructive',
        });
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Rate Limit Countdown */}
      {rateLimitRetryAt && rateLimitRetryAt > new Date() && (
        <div className="glass-card rounded-xl p-4 border-warning/50 bg-warning/10">
          <p className="text-sm text-warning-foreground">
            Rate limited. You can try again at {rateLimitRetryAt.toLocaleTimeString()}.
          </p>
        </div>
      )}

      {/* Generation Form */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create Image</h2>
            <p className="text-sm text-muted-foreground">Describe what you want to generate</p>
          </div>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A futuristic cityscape at sunset with flying cars and neon lights..."
          className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
          maxLength={2000}
        />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{prompt.length} / 2000</span>
        </div>

        {/* Aspect Ratio Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">Aspect Ratio</label>
          <div className="flex gap-3">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.value}
                onClick={() => setAspectRatio(ratio.value)}
                className={cn(
                  'flex-1 py-3 px-4 rounded-xl border transition-all',
                  'flex flex-col items-center gap-1',
                  aspectRatio === ratio.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 bg-background/30 text-muted-foreground hover:border-primary/50'
                )}
              >
                <span className="text-lg">{ratio.icon}</span>
                <span className="text-xs font-medium">{ratio.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex-1 h-12 text-base font-medium"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-5 w-5" />
                Generate Image
              </>
            )}
          </Button>
          
          {isGenerating && (
            <Button
              onClick={cancelGeneration}
              variant="outline"
              className="h-12 px-4"
              aria-label="Cancel generation"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Your Creations</h3>
          <span className="text-sm text-muted-foreground">({generations.length})</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : generations.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No images yet</h4>
            <p className="text-muted-foreground">
              Your generated images will appear here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generations.map((generation) => (
              <GenerationCard
                key={generation.id}
                generation={generation}
                onDelete={() => deleteGeneration(generation.id)}
                onView={() => setPreviewImage({ 
                  url: generation.result_url || '', 
                  prompt: generation.prompt 
                })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          imageUrl={previewImage.url}
          prompt={previewImage.prompt}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
};
