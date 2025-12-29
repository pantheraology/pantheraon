import { Video, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const VideoStudio = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="glass-card rounded-2xl p-12 text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Video className="h-10 w-10 text-primary" />
        </div>
        
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Video Generation
        </h2>
        
        <p className="text-muted-foreground mb-6">
          AI-powered video generation is coming soon! Create stunning videos from text prompts.
        </p>

        <div className="space-y-3 text-left mb-8">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Text-to-video generation</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Image-to-video animation</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Multiple duration options</span>
          </div>
        </div>

        <Button disabled className="w-full" variant="secondary">
          <Clock className="h-4 w-4 mr-2" />
          Coming Soon
        </Button>
      </div>
    </div>
  );
};
