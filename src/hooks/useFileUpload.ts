/**
 * File Upload Hook
 * Handles uploading attachments to Supabase storage
 */

import { useCallback } from 'react';
import { ChatAttachment, UploadedFile } from '@/types';
import { STORAGE_BUCKETS, SIGNED_URL_EXPIRY_SECONDS } from '@/constants/files';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseFileUploadOptions {
  bucket?: string;
  expirySeconds?: number;
  showToasts?: boolean;
}

export const useFileUpload = (options: UseFileUploadOptions = {}) => {
  const {
    bucket = STORAGE_BUCKETS.CHAT_ATTACHMENTS,
    expirySeconds = SIGNED_URL_EXPIRY_SECONDS,
    showToasts = true,
  } = options;

  /**
   * Upload multiple attachments and return signed URLs
   */
  const uploadAttachments = useCallback(async (
    attachments: ChatAttachment[],
    userId: string
  ): Promise<UploadedFile[]> => {
    const uploadedFiles: UploadedFile[] = [];

    for (const attachment of attachments) {
      const filePath = `${userId}/${Date.now()}_${attachment.file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, attachment.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        if (showToasts) {
          toast.error(`Failed to upload ${attachment.file.name}`);
        }
        continue;
      }

      // Get signed URL for the file
      const { data: signedData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, expirySeconds);

      if (signedData?.signedUrl) {
        uploadedFiles.push({
          url: signedData.signedUrl,
          type: attachment.type,
          name: attachment.file.name,
          mimeType: attachment.file.type,
        });
      }
    }

    return uploadedFiles;
  }, [bucket, expirySeconds, showToasts]);

  /**
   * Upload a single file and return its signed URL
   */
  const uploadFile = useCallback(async (
    file: File,
    userId: string,
    type: 'image' | 'document' = 'document'
  ): Promise<UploadedFile | null> => {
    const attachment: ChatAttachment = { file, type };
    const results = await uploadAttachments([attachment], userId);
    return results[0] || null;
  }, [uploadAttachments]);

  return {
    uploadAttachments,
    uploadFile,
  };
};
