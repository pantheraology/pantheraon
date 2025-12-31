import { Button } from '@/components/ui/button';
import { StudioGeneration } from '@/hooks/useStudioGenerations';
import { Trash2, Eye, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GenerationCardProps {
  generation: StudioGeneration;
  onDelete: () => void;
  onView: () => void;
}

export const GenerationCard = ({ generation, onDelete, onView }: GenerationCardProps) => {
  // Use signedUrl if available, fall back to result_url for legacy data
  const imageUrl = generation.signedUrl || generation.result_url;

  const handleDownload = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation-${generation.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="group relative glass-card rounded-xl overflow-hidden">
      {/* Image */}
      <div 
        className="aspect-square bg-muted cursor-pointer"
        onClick={onView}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={generation.prompt}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Overlay on hover */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent',
        'opacity-0 group-hover:opacity-100 transition-opacity',
        'flex flex-col justify-end p-4'
      )}>
        <p className="text-white text-sm line-clamp-2 mb-3">
          {generation.prompt}
        </p>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 h-8"
            onClick={onView}
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-3"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 px-3"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Timestamp badge */}
      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded-md text-xs text-white/80">
        {new Date(generation.created_at).toLocaleDateString()}
      </div>
    </div>
  );
};
