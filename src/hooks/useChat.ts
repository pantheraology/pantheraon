import { useState, useCallback, useRef } from 'react';
import { Message, ChatMode } from '@/types';
import { toast } from 'sonner';
import { getChatUrl } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';

export interface ChatOptions {
  mode?: ChatMode;
  model?: string;
}

const TIMEOUT_MS = 60000; // 60 second timeout

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<Date | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (content: string, options?: ChatOptions) => {
    // Cancel any existing request
    cancelRequest();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    // Setup timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        toast.error('Request timed out. Please try again.');
      }
    }, TIMEOUT_MS);

    let assistantContent = '';

    try {
      // Get the user's session token for authenticated requests
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to use chat');
        setIsLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      const resp = await fetch(getChatUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          mode: options?.mode || 'normal',
          model: options?.model || 'google/gemini-2.5-flash',
        }),
        signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        
        if (resp.status === 429) {
          // Extract retry-after header or default to 60 seconds
          const retryAfter = resp.headers.get('Retry-After');
          const retrySeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
          const retryAt = new Date(Date.now() + retrySeconds * 1000);
          setRateLimitRetryAt(retryAt);
          
          toast.error(`Rate limit exceeded. Please wait ${retrySeconds} seconds.`, {
            duration: 5000,
            description: `You can try again at ${retryAt.toLocaleTimeString()}`,
          });
        } else if (resp.status === 402) {
          toast.error('Usage limit reached. Please add credits to continue.');
        } else {
          toast.error(errorData.error || 'Failed to get AI response');
        }
        
        setIsLoading(false);
        clearTimeout(timeoutId);
        return;
      }

      if (!resp.body) {
        throw new Error('No response body');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      // Create assistant message placeholder
      const assistantId = crypto.randomUUID();
      setMessages(prev => [...prev, { 
        id: assistantId, 
        role: 'assistant', 
        content: '',
        timestamp: new Date(),
      }]);

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        
        // Check if aborted
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
              assistantContent += chunkContent;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
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
              assistantContent += chunkContent;
            }
          } catch { /* ignore */ }
        }
        
        // Final update
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantId 
              ? { ...m, content: assistantContent }
              : m
          )
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled - don't show error
        console.log('Request cancelled');
      } else {
        console.error('Chat error:', error);
        toast.error('Failed to send message. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [messages, cancelRequest]);

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
  };
};
