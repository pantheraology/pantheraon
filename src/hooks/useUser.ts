/**
 * User Hook - Read-only user state
 * Provides access to current user, profile, and loading state
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useUser = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useUser must be used within an AuthProvider');
  }
  
  return {
    user: context.user,
    session: context.session,
    profile: context.profile,
    isLoading: context.isLoading,
  };
};
