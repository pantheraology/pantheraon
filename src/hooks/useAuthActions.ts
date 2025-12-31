/**
 * Auth Actions Hook - Authentication operations
 * Provides methods for sign in, sign up, sign out, and profile management
 */

import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export const useAuthActions = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthActions must be used within an AuthProvider');
  }
  
  return {
    signInWithEmail: context.signInWithEmail,
    signUpWithEmail: context.signUpWithEmail,
    signInWithGoogle: context.signInWithGoogle,
    signOut: context.signOut,
    updateProfile: context.updateProfile,
    refreshProfile: context.refreshProfile,
    deleteAccount: context.deleteAccount,
  };
};
