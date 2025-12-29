import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSidebar } from "@/hooks/useSidebar";
import { SIDEBAR_WIDTH } from "@/constants/layout";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Lazy load route components for code splitting
const Index = lazy(() => import("./pages/Index"));
const Discover = lazy(() => import("./pages/Discover"));
const Groups = lazy(() => import("./pages/Groups"));
const Agent = lazy(() => import("./pages/Agent"));
const Assistants = lazy(() => import("./pages/Assistants"));
const Studio = lazy(() => import("./pages/Studio"));
const Spaces = lazy(() => import("./pages/Spaces"));
const Library = lazy(() => import("./pages/Library"));
const Settings = lazy(() => import("./pages/Settings"));
const Archived = lazy(() => import("./pages/Archived"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppContent = () => {
  const { isOpen, isMobile, toggle, close } = useSidebar();

  return (
    <div className="flex w-full min-h-screen bg-background">
      <BackgroundEffects />
      <MobileMenuButton isOpen={isOpen} onClick={toggle} />
      <Sidebar isOpen={isOpen} isMobile={isMobile} onClose={close} />
      <main
        className="flex-1 relative transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : SIDEBAR_WIDTH }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/groups" element={<Groups />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/assistants" element={<Assistants />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/spaces" element={<Spaces />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/archived" element={<Archived />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
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
