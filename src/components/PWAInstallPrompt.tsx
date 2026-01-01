import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DURATION = 1000 * 60 * 60 * 24 * 7; // 7 days

export const PWAInstallPrompt = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall, canShowPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if dismissed recently
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      if (Date.now() - dismissedAt < DISMISS_DURATION) {
        return;
      }
    }

    // Show prompt after a delay for better UX
    const timer = setTimeout(() => {
      if ((canShowPrompt || (isIOS && !isInstalled)) && !isInstalled) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canShowPrompt, isIOS, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSInstructions(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    
    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
    }
  };

  if (!isVisible || isInstalled) return null;

  return (
    <div className={cn(
      "fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm",
      "bg-card border border-border rounded-xl shadow-xl",
      "animate-slide-up"
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">
              {showIOSInstructions ? 'Install on iOS' : 'Install PantheraON'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {showIOSInstructions 
                ? 'Tap the Share button, then "Add to Home Screen"'
                : 'Get quick access from your home screen'
              }
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} className="text-muted-foreground" />
          </button>
        </div>
        
        {showIOSInstructions ? (
          <div className="mt-4 flex items-center justify-center gap-2 py-3 bg-muted/50 rounded-lg">
            <Share size={20} className="text-primary" />
            <span className="text-sm">Tap Share → Add to Home Screen</span>
          </div>
        ) : (
          <Button
            onClick={handleInstall}
            className="w-full mt-4"
            size="sm"
          >
            <Download size={16} className="mr-2" />
            {isIOS ? 'How to Install' : 'Install App'}
          </Button>
        )}
      </div>
    </div>
  );
};
