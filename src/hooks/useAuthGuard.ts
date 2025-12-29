import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAuthGuard = () => {
  const { user, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = useCallback((action: () => void) => {
    if (isLoading) return;
    
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    action();
  }, [user, isLoading]);

  const closeAuthModal = useCallback(() => {
    setShowAuthModal(false);
  }, []);

  return {
    isSignedIn: !!user,
    isLoaded: !isLoading,
    showAuthModal,
    requireAuth,
    closeAuthModal,
  };
};
