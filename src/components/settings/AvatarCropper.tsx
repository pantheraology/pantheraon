import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface AvatarCropperProps {
  open: boolean;
  onClose: () => void;
  imageFile: File | null;
  onCropComplete: (croppedBlob: Blob) => void;
}

export const AvatarCropper = ({ open, onClose, imageFile, onCropComplete }: AvatarCropperProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isCropping, setIsCropping] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  // Preload image for canvas operations
  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleCrop = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current) return;

    setIsCropping(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const outputSize = 256; // Output avatar size
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Clear canvas
      ctx.clearRect(0, 0, outputSize, outputSize);

      // Create circular clip path
      ctx.beginPath();
      ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate the crop area
      const containerSize = 200; // Size of the preview container
      const scale = outputSize / containerSize;

      // Apply transformations
      ctx.save();
      ctx.translate(outputSize / 2, outputSize / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom * scale, zoom * scale);

      // Calculate image dimensions to fit
      const img = imageRef.current;
      const imgRatio = img.width / img.height;
      let drawWidth, drawHeight;
      
      if (imgRatio > 1) {
        drawHeight = containerSize;
        drawWidth = containerSize * imgRatio;
      } else {
        drawWidth = containerSize;
        drawHeight = containerSize / imgRatio;
      }

      // Draw the image centered with position offset
      ctx.drawImage(
        img,
        -drawWidth / 2 + position.x / zoom,
        -drawHeight / 2 + position.y / zoom,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
          setIsCropping(false);
        },
        'image/webp',
        0.9
      );
    } catch (error) {
      console.error('Error cropping image:', error);
      setIsCropping(false);
    }
  }, [zoom, rotation, position, onCropComplete]);

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crop Avatar</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Crop Area */}
          <div
            ref={containerRef}
            className="relative w-[200px] h-[200px] rounded-full overflow-hidden bg-muted cursor-move border-2 border-primary"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={imageSrc}
              alt="Crop preview"
              className="absolute w-full h-full object-cover pointer-events-none select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
              draggable={false}
            />
          </div>

          {/* Zoom Control */}
          <div className="flex items-center gap-3 w-full max-w-[200px]">
            <ZoomOut size={16} className="text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn size={16} className="text-muted-foreground" />
          </div>

          {/* Rotate Button */}
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <RotateCw size={16} className="mr-2" />
            Rotate
          </Button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isCropping}>
            {isCropping ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Cropping...
              </>
            ) : (
              'Apply'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
