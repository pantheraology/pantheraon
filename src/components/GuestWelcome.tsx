import { Link } from 'react-router-dom';
import { MessageSquare, Compass, Sparkles, Zap, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { SuggestionChips } from '@/components/SuggestionChips';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { AuthModal } from '@/components/AuthModal';

const features = [
  {
    icon: MessageSquare,
    title: 'AI Conversations',
    description: 'Chat with advanced AI to get answers, ideas, and assistance on any topic.',
  },
  {
    icon: Compass,
    title: 'Discover Content',
    description: 'Explore curated categories and find inspiration across various domains.',
  },
  {
    icon: Sparkles,
    title: 'Personal Spaces',
    description: 'Organize your conversations into custom spaces for different projects.',
  },
  {
    icon: Shield,
    title: 'Private Library',
    description: 'Save and access your conversation history anytime, anywhere.',
  },
];

export const GuestWelcome = () => {
  const { showAuthModal, requireAuth, closeAuthModal } = useAuthGuard();

  const handleSuggestionSelect = (prompt: string) => {
    requireAuth(() => {
      // Will be handled after auth
      console.log('Selected prompt:', prompt);
    });
  };

  return (
    <div className="relative flex-1 h-screen flex flex-col overflow-y-auto">
      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 md:px-8 pt-20">
        {/* Glow effect behind title */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-3xl mx-auto animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-b from-primary/80 via-primary to-primary/60 shadow-[0_0_50px_hsl(var(--primary)/0.5)] flex items-center justify-center text-primary-foreground font-bold text-xl">
              P
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight mb-6">
            Welcome to{' '}
            <span className="text-gradient">{BRAND.APP_NAME}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {BRAND.TAGLINE}. Start a conversation, explore ideas, and unlock the power of AI assistance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="gap-2 px-8 py-6 text-lg shadow-lg hover:shadow-primary/25">
                <Zap size={20} />
                Get Started Free
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="outline" size="lg" className="gap-2 px-8 py-6 text-lg">
                <Compass size={20} />
                Explore First
              </Button>
            </Link>
          </div>
        </div>

        {/* Suggestion chips preview */}
        <div className="relative z-10 w-full max-w-[740px] animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <p className="text-sm text-muted-foreground text-center mb-4">Try asking something:</p>
          <SuggestionChips onSelect={handleSuggestionSelect} />
        </div>
      </div>

      {/* Features Section */}
      <div className="relative z-10 px-4 md:px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-4">
            Unlock Premium Features
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Sign up to access all the powerful features that make {BRAND.APP_NAME} your perfect AI companion.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass rounded-xl p-6 hover:bg-card/90 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 animate-slide-up"
                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="text-primary" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* CTA at bottom */}
          <div className="text-center mt-12">
            <Link to="/auth">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={closeAuthModal}
        message="Sign in to send messages and save your conversations."
      />
    </div>
  );
};
