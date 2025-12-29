import { Music, Clock, Mic, Languages, Waves, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const AudioStudio = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="glass-card rounded-2xl p-8 md:p-12 text-center max-w-lg w-full">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Music className="h-10 w-10 text-primary" />
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Audio Generation
        </h2>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          AI-powered audio generation is coming soon! Create natural voiceovers, sound effects, and music from text descriptions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          <Card className="p-4 bg-muted/30 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Text-to-Speech</p>
                <p className="text-xs text-muted-foreground">Natural voice synthesis</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-muted/30 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Languages className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Multi-Language</p>
                <p className="text-xs text-muted-foreground">30+ languages & accents</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-muted/30 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Waves className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Sound Effects</p>
                <p className="text-xs text-muted-foreground">Custom audio from text</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-muted/30 border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Volume2 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">Voice Cloning</p>
                <p className="text-xs text-muted-foreground">Create custom voices</p>
              </div>
            </div>
          </Card>
        </div>

        <Button disabled className="w-full" variant="secondary" size="lg">
          <Clock className="h-4 w-4 mr-2" />
          Coming Soon
        </Button>
        
        <p className="text-xs text-muted-foreground mt-4">
          We're working hard to bring you the best audio generation experience.
        </p>
      </div>
    </div>
  );
};
