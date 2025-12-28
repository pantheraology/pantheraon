import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { MobileMenuButton } from "@/components/MobileMenuButton";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useSidebar } from "@/hooks/useSidebar";
import { SIDEBAR_WIDTH } from "@/constants/layout";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Spaces from "./pages/Spaces";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import Archived from "./pages/Archived";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/spaces" element={<Spaces />} />
          <Route path="/library" element={<Library />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/archived" element={<Archived />} />
          <Route path="/sign-in/*" element={<SignIn />} />
          <Route path="/sign-up/*" element={<SignUp />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
