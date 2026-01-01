import { Download, Share, Plus, Smartphone, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

const Install = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();

  const handleInstall = async () => {
    if (isInstallable) {
      await promptInstall();
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-safe pb-safe">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Already Installed!</h1>
          <p className="text-muted-foreground">
            PantheraON is already installed on your device. You can find it on your home screen.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-6 pt-safe pb-safe">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto">
        {/* App Icon */}
        <div className="w-24 h-24 bg-gradient-to-b from-primary to-primary/70 rounded-3xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30">
          <Smartphone size={48} className="text-primary-foreground" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2">Install PantheraON</h1>
        <p className="text-muted-foreground text-center mb-8">
          Add to your home screen for the best experience
        </p>

        {/* Benefits */}
        <div className="w-full space-y-4 mb-8">
          {[
            'Works offline',
            'Faster load times',
            'Quick access from home screen',
            'Full-screen experience',
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <CheckCircle size={18} className="text-primary flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Install Options */}
        {isIOS ? (
          <div className="w-full space-y-6">
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="font-semibold mb-4">How to install on iOS:</h3>
              <ol className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                    1
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">Tap the Share button</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                      <Share size={16} /> at the bottom of Safari
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                    2
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">Tap "Add to Home Screen"</p>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                      <Plus size={16} /> in the share menu
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                    3
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">Tap "Add"</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      The app will appear on your home screen
                    </p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        ) : isInstallable ? (
          <Button onClick={handleInstall} size="lg" className="w-full">
            <Download size={20} className="mr-2" />
            Install App
          </Button>
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Open this page in Chrome, Safari, or Edge to install
            </p>
            <div className="bg-card border border-border rounded-xl p-4 text-left">
              <h3 className="font-semibold mb-3">Manual installation:</h3>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li>1. Open browser menu (⋮ or ⋯)</li>
                <li>2. Look for "Install app" or "Add to Home Screen"</li>
                <li>3. Follow the prompts to install</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Install;
