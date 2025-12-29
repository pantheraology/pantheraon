import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/components/layout/PageContainer';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthModal } from '@/components/AuthModal';
import { ImageStudio } from '@/components/studio/ImageStudio';
import { VideoStudio } from '@/components/studio/VideoStudio';
import { AudioStudio } from '@/components/studio/AudioStudio';
import { Image, Video, Music, Palette } from 'lucide-react';

const Studio = () => {
  const { isSignedIn, isLoaded, showAuthModal, closeAuthModal } = useAuthGuard();

  if (isLoaded && !isSignedIn) {
    return (
      <PageContainer>
        <AuthPrompt
          title="AI Creation Studio"
          description="Sign in to access powerful AI tools for generating images, videos, and audio content."
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Palette className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Studio</h1>
          </div>
          <p className="text-muted-foreground">
            Create stunning AI-generated content with our creative tools
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="image" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger 
              value="image" 
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background"
            >
              <Image className="h-4 w-4" />
              <span className="hidden sm:inline">Image</span>
            </TabsTrigger>
            <TabsTrigger 
              value="video"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background"
            >
              <Video className="h-4 w-4" />
              <span className="hidden sm:inline">Video</span>
            </TabsTrigger>
            <TabsTrigger 
              value="audio"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background"
            >
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Audio</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-6">
            <ImageStudio />
          </TabsContent>

          <TabsContent value="video" className="mt-6">
            <VideoStudio />
          </TabsContent>

          <TabsContent value="audio" className="mt-6">
            <AudioStudio />
          </TabsContent>
        </Tabs>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={closeAuthModal} />
    </PageContainer>
  );
};

export default Studio;
