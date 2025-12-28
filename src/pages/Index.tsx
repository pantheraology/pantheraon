import { useState, useEffect, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';
import { HeaderWidget } from '@/components/HeaderWidget';
import { ChatInput } from '@/components/ChatInput';
import { MessageList } from '@/components/MessageList';
import { SuggestionChips } from '@/components/SuggestionChips';
import { AuthModal } from '@/components/AuthModal';
import { useChat } from '@/hooks/useChat';
import { useConversations } from '@/hooks/useConversations';
import { useAuthGuard } from '@/hooks/useAuthGuard';

const Index = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const { saveConversation } = useConversations();
  const { isSignedIn, showAuthModal, requireAuth, closeAuthModal } = useAuthGuard();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  const [greeting, setGreeting] = useState('Good Evening');

  // Set greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Save conversation when messages change (only if signed in)
  useEffect(() => {
    if (isSignedIn && messages.length >= 2) {
      const id = saveConversation(messages, currentConversationId);
      if (!currentConversationId) {
        setCurrentConversationId(id);
      }
    }
  }, [messages, currentConversationId, saveConversation, isSignedIn]);

  const handleNewThread = useCallback(() => {
    clearMessages();
    setCurrentConversationId(undefined);
  }, [clearMessages]);

  const handleSendMessage = useCallback((content: string) => {
    requireAuth(() => {
      sendMessage(content);
    });
  }, [requireAuth, sendMessage]);

  const handleSuggestionSelect = useCallback((prompt: string) => {
    requireAuth(() => {
      sendMessage(prompt);
    });
  }, [requireAuth, sendMessage]);

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex-1 h-screen flex flex-col">
      <HeaderWidget onNewThread={handleNewThread} />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center overflow-y-auto px-4 md:px-8">
        {!hasMessages ? (
          // Welcome State
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[740px] gap-8 py-20">
            <h1 className="text-4xl md:text-5xl font-light text-center text-foreground leading-tight drop-shadow-2xl animate-fade-in">
              {greeting} <br />
              <span className="text-muted-foreground">How Can I help you Today?</span>
            </h1>

            <div className="w-full animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading} 
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <SuggestionChips onSelect={handleSuggestionSelect} />
            </div>
          </div>
        ) : (
          // Chat State
          <div className="flex-1 flex flex-col w-full max-w-[740px] pt-20 pb-4">
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} isLoading={isLoading} />
            </div>
            
            <div className="sticky bottom-0 pt-4 bg-gradient-to-t from-background via-background to-transparent">
              <ChatInput 
                onSend={handleSendMessage} 
                isLoading={isLoading}
                placeholder="Continue the conversation..." 
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <button className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-gradient-to-b from-primary to-primary/60 shadow-lg flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform z-20">
        <HelpCircle size={24} />
      </button>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={closeAuthModal}
        message="Sign in to send messages and save your conversations."
      />
    </div>
  );
};

export default Index;
