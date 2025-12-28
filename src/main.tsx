import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import App from './App.tsx';
import { BootstrapLoader } from './components/BootstrapLoader';
import { clerkAppearance } from './config/clerk';
import { resolveClerkPublishableKey } from './lib/config';
import './index.css';

function ClerkProviderWithRoutes({ clerkKey }: { clerkKey: string }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider 
      publishableKey={clerkKey} 
      appearance={clerkAppearance} 
      afterSignOutUrl="/"
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="https://accounts.panthera.ai/sign-in"
      signUpUrl="https://accounts.panthera.ai/sign-up"
    >
      <App />
    </ClerkProvider>
  );
}

function Bootstrap() {
  const [clerkKey, setClerkKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    resolveClerkPublishableKey()
      .then((key) => {
        if (!alive) return;
        if (!key) {
          setError('Missing VITE_CLERK_PUBLISHABLE_KEY');
          return;
        }
        setClerkKey(key);
      })
      .catch(() => {
        if (!alive) return;
        setError('Failed to load Clerk configuration');
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error || !clerkKey) {
    return <BootstrapLoader error={error} />;
  }

  return (
    <BrowserRouter>
      <ClerkProviderWithRoutes clerkKey={clerkKey} />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')!).render(<Bootstrap />);
