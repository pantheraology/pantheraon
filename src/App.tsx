import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SIDEBAR_WIDTH } from "@/constants/layout";
import Index from "./pages/Index";
import Discover from "./pages/Discover";
import Spaces from "./pages/Spaces";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <div className="flex w-full min-h-screen bg-background">
            <BackgroundEffects />
            <Sidebar />
            <main className="flex-1 relative" style={{ marginLeft: SIDEBAR_WIDTH }}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/spaces" element={<Spaces />} />
                <Route path="/library" element={<Library />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
