/**
 * Chat Stream Hook
 * Handles SSE streaming from the chat API
 */

import { useCallback, useRef } from 'react';
import { getChatUrl } from '@/lib/api';
import { CHAT_TIMEOUT_MS, RATE_LIMIT_DEFAULT_SECONDS } from '@/constants/timing';
import { toast } from 'sonner';

interface StreamMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface StreamOptions {
  mode?: string;
  model?: string;
  agentId?: string;
  attachments?: unknown[];
}

interface StreamCallbacks {
  onChunk: (content: string) => void;
  onComplete: () => void;
  onError: (error: Error) => void;
  onRateLimit?: (retryAt: Date) => void;
}

export const useChatStream = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cancel any ongoing stream request
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Stream chat response from the API
   */
  const streamChat = useCallback(async (
    messages: StreamMessage[],
    accessToken: string,
    options: StreamOptions,
    callbacks: StreamCallbacks
  ): Promise<void> => {
    // Cancel any existing request
    cancelStream();

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Setup timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        toast.error('Request timed out. Please try again.');
      }
    }, CHAT_TIMEOUT_MS);

    let content = '';

    try {
      const resp = await fetch(getChatUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          mode: options.mode || 'normal',
          model: options.model || 'google/gemini-2.5-flash',
          agentId: options.agentId,
          attachments: options.attachments,
        }),
        signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        
        if (resp.status === 429) {
          const retryAfter = resp.headers.get('Retry-After');
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : RATE_LIMIT_DEFAULT_SECONDS;
          const retryAt = new Date(Date.now() + retrySeconds * 1000);
          
          callbacks.onRateLimit?.(retryAt);
          toast.error(`Rate limit exceeded. Please wait ${retrySeconds} seconds.`);
          callbacks.onError(new Error('Rate limited'));
          return;
        } else if (resp.status === 402) {
          toast.error('Usage limit reached. Please add credits to continue.');
          callbacks.onError(new Error('Payment required'));
          return;
        } else {
          const errorMsg = errorData.error || 'Failed to get AI response';
          toast.error(errorMsg);
          callbacks.onError(new Error(errorMsg));
          return;
        }
      }

      if (!resp.body) {
        throw new Error('No response body');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (signal.aborted) {
          reader.cancel();
          break;
        }
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const chunkContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunkContent) {
              content += chunkContent;
              callbacks.onChunk(content);
            }
          } catch {
            // Incomplete JSON, put it back and wait for more data
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim() && !signal.aborted) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const chunkContent = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (chunkContent) {
              content += chunkContent;
              callbacks.onChunk(content);
            }
          } catch { /* ignore */ }
        }
      }

      callbacks.onComplete();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled - don't show error
      } else {
        console.error('Stream error:', error);
        callbacks.onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
    }
  }, [cancelStream]);

  return {
    streamChat,
    cancelStream,
  };
};
