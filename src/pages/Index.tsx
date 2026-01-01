import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HeaderWidget } from '@/components/HeaderWidget';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { SuggestionChips } from '@/components/SuggestionChips';
import { RateLimitCountdown } from '@/components/chat/RateLimitCountdown';
import { useChat, ChatOptions } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    rateLimitRetryAt,
    clearRateLimit,
    setInitialMessages,
  } = useChat();
  const {
    saveConversation,
    getConversation,
  } = useConversations();
  const {
    isSignedIn,
  } = useAuthGuard();
  const { user, profile } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(conversationId);
  const [greeting, setGreeting] = useState('Good Evening');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // Get user's display name
  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || '';

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Load conversation from URL parameter
  useEffect(() => {
    if (conversationId && conversationId !== currentConversationId) {
      setIsLoadingConversation(true);
      const conversation = getConversation(conversationId);
      if (conversation && conversation.messages.length > 0) {
        setInitialMessages(conversation.messages);
        setCurrentConversationId(conversationId);
      }
      setIsLoadingConversation(false);
    }
  }, [conversationId, currentConversationId, getConversation, setInitialMessages]);

  // Save conversation when messages change (only if signed in)
  useEffect(() => {
    const saveMessages = async () => {
      if (isSignedIn && messages.length >= 2) {
        const id = await saveConversation(messages, currentConversationId);
        if (id && !currentConversationId) {
          setCurrentConversationId(id);
          // Update URL without triggering a navigation
          window.history.replaceState(null, '', `/chat/${id}`);
        }
      }
    };
    saveMessages();
  }, [messages, currentConversationId, saveConversation, isSignedIn]);

  const handleNewThread = useCallback(() => {
    clearMessages();
    setCurrentConversationId(undefined);
    navigate('/');
  }, [clearMessages, navigate]);

  const handleSendMessage = useCallback((content: string, options?: ChatOptions) => {
    sendMessage(content, options);
  }, [sendMessage]);

  const handleSuggestionSelect = useCallback((prompt: string) => {
    sendMessage(prompt, { mode: 'normal', model: 'google/gemini-2.5-flash' });
  }, [sendMessage]);

  const hasMessages = messages.length > 0;
  
  return (
    <div className="relative flex-1 h-full flex flex-col">
      <HeaderWidget onNewThread={handleNewThread} />

      {/* Main Content */}
      {!hasMessages ? (
        // Welcome State - centered with scroll if needed
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-y-auto px-4 pb-20 md:pb-4">
          <div className="w-full max-w-[740px] flex flex-col items-center gap-4 md:gap-6 py-6">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-light text-center text-foreground leading-tight animate-fade-in">
              {greeting}{displayName ? `, ${displayName}` : ''}
            </h1>

            {rateLimitRetryAt && (
              <RateLimitCountdown 
                retryAt={rateLimitRetryAt} 
                onExpired={clearRateLimit}
              />
            )}

            <div className="w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <ChatInput onSend={handleSendMessage} isLoading={isLoading || isLoadingConversation} />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <SuggestionChips onSelect={handleSuggestionSelect} />
            </div>
          </div>
        </div>
      ) : (
        // Chat State - messages scroll, input docked at bottom
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          {/* Scrollable messages area */}
          <div className="flex-1 overflow-y-auto px-3 md:px-4">
            <div className="w-full max-w-[740px] mx-auto pb-4">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
          </div>
          
          {/* Docked input area - not sticky, fixed at bottom of flex container */}
          <div className="shrink-0 px-3 md:px-4 pb-20 md:pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent">
            <div className="w-full max-w-[740px] mx-auto">
              {rateLimitRetryAt && (
                <div className="mb-2">
                  <RateLimitCountdown 
                    retryAt={rateLimitRetryAt} 
                    onExpired={clearRateLimit}
                  />
                </div>
              )}
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading} 
                placeholder="Message..." 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
