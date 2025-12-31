/**
 * Attachment Preview Component
 * Displays uploaded file attachments with remove functionality
 */

import { X, FileText } from 'lucide-react';
import { ChatAttachment } from '@/types';

interface AttachmentPreviewProps {
  attachments: ChatAttachment[];
  onRemove: (index: number) => void;
}

export const AttachmentPreview = ({ attachments, onRemove }: AttachmentPreviewProps) => {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((attachment, index) => (
        <div
          key={index}
          className="relative group bg-muted rounded-lg overflow-hidden"
        >
          {attachment.type === 'image' && attachment.preview ? (
            <img
              src={attachment.preview}
              alt={attachment.file.name}
              className="h-16 w-16 object-cover"
            />
          ) : (
            <div className="h-16 w-16 flex items-center justify-center">
              <FileText size={24} className="text-muted-foreground" />
            </div>
          )}
          <button
            onClick={() => onRemove(index)}
            className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 truncate">
            {attachment.file.name}
          </div>
        </div>
      ))}
    </div>
  );
};
