import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

export const useAuthGuard = () => {
  const { isSignedIn, isLoaded } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback((action: () => void) => {
    if (!isLoaded) return;
    
    if (!isSignedIn) {
      setShowAuthModal(true);
      return;
    }
    
    action();
  }, [isSignedIn, isLoaded]);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return {
    isSignedIn: isSignedIn ?? false,
    isLoaded,
    showAuthModal,
    requireAuth,
    closeAuthModal,
  };
};
