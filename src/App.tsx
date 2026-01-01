import { lazy, Suspense, useCallback } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BottomNavigation } from "@/components/BottomNavigation";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useSidebar } from "@/hooks/useSidebar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { SIDEBAR_WIDTH } from "@/constants/layout";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Discover = lazy(() => import("./pages/Discover"));
const Groups = lazy(() => import("./pages/Groups"));
const Agent = lazy(() => import("./pages/Agent"));
const Assistants = lazy(() => import("./pages/Assistants"));
const Studio = lazy(() => import("./pages/Studio"));
const Promptbase = lazy(() => import("./pages/Promptbase"));
const Spaces = lazy(() => import("./pages/Spaces"));
const Library = lazy(() => import("./pages/Library"));
const Settings = lazy(() => import("./pages/Settings"));
const Archived = lazy(() => import("./pages/Archived"));
const Auth = lazy(() => import("./pages/Auth"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Configure QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppContent = () => {
  const { isOpen, isMobile, toggle, close, open } = useSidebar();
  const navigate = useNavigate();
  
  // Initialize global keyboard shortcuts
  useKeyboardShortcuts();

  // Handle new chat from bottom navigation
  const handleNewChat = useCallback(() => {
    navigate('/');
    // Dispatch event to clear chat state
    window.dispatchEvent(new CustomEvent('new-chat'));
  }, [navigate]);

  // Swipe gesture for sidebar control
  const { handlers: swipeHandlers } = useSwipeGesture({
    onSwipeRight: open,
    onSwipeLeft: close,
    threshold: 50,
    edgeWidth: 30,
  });

  return (
    <div 
      className="flex w-full min-h-screen bg-background"
      {...(isMobile ? swipeHandlers : {})}
    >
      <BackgroundEffects />
      <MobileMenuButton isOpen={isOpen} onClick={toggle} />
      <Sidebar isOpen={isOpen} isMobile={isMobile} onClose={close} />
      <main
        className="flex-1 relative transition-all duration-300 pb-16 md:pb-0"
        style={{ marginLeft: isMobile ? 0 : SIDEBAR_WIDTH }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/chat/:conversationId" element={<Index />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/assistants" element={<Assistants />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/promptbase" element={<Promptbase />} />
            <Route path="/spaces" element={<Spaces />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/archived" element={<Archived />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      
      {/* Mobile bottom navigation */}
      <BottomNavigation onNewChat={handleNewChat} />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
