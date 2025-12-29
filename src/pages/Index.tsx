import { useState, useEffect, useCallback } from 'react';
import { HeaderWidget } from '@/components/HeaderWidget';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { SuggestionChips } from '@/components/SuggestionChips';
import { useChat, ChatOptions } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useAuth } from '@/contexts/AuthContext';
const Index = () => {
  const {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  } = useChat();
  const {
    saveConversation
  } = useConversations();
  const {
    isSignedIn
  } = useAuthGuard();
  const { user, profile } = useAuth();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [greeting, setGreeting] = useState('Good Evening');

  // Get user's display name
  const displayName = profile?.full_name || profile?.username || user?.email?.split('@')[0] || '';

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');else if (hour < 17) setGreeting('Good Afternoon');else setGreeting('Good Evening');
  }, []);

  // Save conversation when messages change (only if signed in)
  useEffect(() => {
    const saveMessages = async () => {
      if (isSignedIn && messages.length >= 2) {
        const id = await saveConversation(messages, currentConversationId);
        if (id && !currentConversationId) {
          setCurrentConversationId(id);
        }
      }
    };
    saveMessages();
  }, [messages, currentConversationId, saveConversation, isSignedIn]);
  const handleNewThread = useCallback(() => {
    clearMessages();
    setCurrentConversationId(undefined);
  }, [clearMessages]);
  const handleSendMessage = useCallback((content: string, options?: ChatOptions) => {
    sendMessage(content, options);
  }, [sendMessage]);
  const handleSuggestionSelect = useCallback((prompt: string) => {
    sendMessage(prompt, { mode: 'normal', model: 'google/gemini-2.5-flash' });
  }, [sendMessage]);
  const hasMessages = messages.length > 0;
  return <div className="relative flex-1 h-screen flex flex-col">
      <HeaderWidget onNewThread={handleNewThread} />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center overflow-y-auto px-4 md:px-8">
        {!hasMessages ?
      // Welcome State
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[740px] gap-8 py-20">
            <h1 className="text-4xl md:text-5xl font-light text-center text-foreground leading-tight drop-shadow-2xl animate-fade-in">
              {greeting}{displayName ? `, ${displayName}` : ''} <br />
              
            </h1>

            <div className="w-full animate-slide-up" style={{
          animationDelay: '0.1s'
        }}>
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </div>

            <div className="animate-slide-up" style={{
          animationDelay: '0.2s'
        }}>
              <SuggestionChips onSelect={handleSuggestionSelect} />
            </div>
          </div> :
      // Chat State
      <div className="flex-1 flex flex-col w-full max-w-[740px] pt-20 pb-4">
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
            
            <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-background via-background to-transparent">
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} placeholder="Continue the conversation..." />
            </div>
          </div>}
      </div>
    </div>;
};
export default Index;