/**
 * Chat Hook - Orchestrator
 * Combines file upload and streaming into a unified chat experience
 */

import { useState, useCallback } from 'react';
import { Message, ChatOptions, UploadedFile } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useFileUpload } from './useFileUpload';
import { useChatStream } from './useChatStream';

// Re-export types for backward compatibility
export type { ChatOptions } from '@/types';

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<Date | null>(null);

  const { uploadAttachments } = useFileUpload();
  const { streamChat, cancelStream } = useChatStream();

  const cancelRequest = useCallback(() => {
    cancelStream();
    setIsLoading(false);
  }, [cancelStream]);

  const clearRateLimit = useCallback(() => {
    setRateLimitRetryAt(null);
  }, []);

  const setInitialMessages = useCallback((initialMessages: Message[]) => {
    setMessages(initialMessages);
  }, []);

  const sendMessage = useCallback(async (content: string, options?: ChatOptions) => {
    // Check if rate limited
    if (rateLimitRetryAt && rateLimitRetryAt > new Date()) {
      toast.error('Please wait for the rate limit to expire');
      return;
    }

    // Cancel any existing request
    cancelRequest();

    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please sign in to use chat');
      return;
    }

    // Upload attachments if any
    let uploadedFiles: UploadedFile[] = [];
    if (options?.attachments && options.attachments.length > 0) {
      toast.loading('Uploading files...');
      uploadedFiles = await uploadAttachments(options.attachments, session.user.id);
      toast.dismiss();
      
      if (uploadedFiles.length === 0 && options.attachments.length > 0) {
        toast.error('Failed to upload files');
        return;
      }
    }

    // Build message content with file references
    let messageContent = content;
    if (uploadedFiles.length > 0) {
      const fileDescriptions = uploadedFiles.map(f => 
        f.type === 'image' ? `[Image: ${f.name}]` : `[Document: ${f.name}]`
      ).join(' ');
      messageContent = content ? `${content}\n\n${fileDescriptions}` : fileDescriptions;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    const assistantId = crypto.randomUUID();
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add placeholder assistant message
    setMessages(prev => [...prev, { 
      id: assistantId, 
      role: 'assistant', 
      content: '',
      timestamp: new Date(),
    }]);

    await streamChat(
      [...messages, userMessage],
      session.access_token,
      {
        mode: options?.mode,
        model: options?.model,
        agentId: options?.agentId,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      },
      {
        onChunk: (content) => {
          setMessages(prev => 
            prev.map(m => m.id === assistantId ? { ...m, content } : m)
          );
        },
        onComplete: () => {
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
        onRateLimit: (retryAt) => {
          setRateLimitRetryAt(retryAt);
        },
      }
    );
  }, [messages, cancelRequest, rateLimitRetryAt, uploadAttachments, streamChat]);

  const clearMessages = useCallback(() => {
    cancelRequest();
    setMessages([]);
  }, [cancelRequest]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    cancelRequest,
    rateLimitRetryAt,
    clearRateLimit,
    setInitialMessages,
  };
};
