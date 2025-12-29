import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ImagePreviewModalProps {
  imageUrl: string;
  prompt: string;
  onClose: () => void;
}

export const ImagePreviewModal = ({ imageUrl, prompt, onClose }: ImagePreviewModalProps) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-background/95 backdrop-blur-xl border-border/50">
        <div className="relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image */}
          <div className="max-h-[70vh] overflow-hidden flex items-center justify-center bg-black/20">
            <img
              src={imageUrl}
              alt={prompt}
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>

          {/* Footer */}
          <div className="p-6 space-y-4">
            <p className="text-foreground text-sm leading-relaxed">{prompt}</p>
            
            <div className="flex justify-end">
              <Button onClick={handleDownload} variant="secondary">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
