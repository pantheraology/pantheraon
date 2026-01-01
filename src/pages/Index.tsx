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
    <div className="relative flex-1 h-screen flex flex-col pb-20 md:pb-0">
      <HeaderWidget onNewThread={handleNewThread} />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center overflow-y-auto px-4 md:px-8">
        {!hasMessages ? (
          // Welcome State
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[740px] gap-6 py-12 px-2">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-light text-center text-foreground leading-tight drop-shadow-2xl animate-fade-in break-words">
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
        ) : (
          // Chat State
          <div className="flex-1 flex flex-col w-full max-w-[740px] pt-16 pb-4">
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
            
            {rateLimitRetryAt && (
              <div className="mb-4">
                <RateLimitCountdown 
                  retryAt={rateLimitRetryAt} 
                  onExpired={clearRateLimit}
                />
              </div>
            )}
            
            <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-background via-background to-transparent pb-2">
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading} 
                placeholder="Continue the conversation..." 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
