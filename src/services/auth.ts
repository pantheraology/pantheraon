/**
 * Auth Service
 * Encapsulates authentication-related API operations
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Delete user account via edge function
 */
export async function deleteAccount(accessToken: string): Promise<void> {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to delete account');
  }

  // Sign out locally after successful deletion
  await supabase.auth.signOut();
}
