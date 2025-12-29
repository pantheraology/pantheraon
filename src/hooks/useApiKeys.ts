import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ApiKeyProvider, UserApiKey } from '@/types';
import { toast } from 'sonner';

export const useApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApiKeys = useCallback(async () => {
    if (!user) {
      setApiKeys([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data as UserApiKey[]) || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error('Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const saveApiKey = async (provider: ApiKeyProvider, apiKey: string) => {
    if (!user) {
      toast.error('Please sign in to save API keys');
      return { error: new Error('Not authenticated') };
    }

    try {
      // Upsert - update if exists, insert if not
      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: user.id,
          provider,
          api_key: apiKey,
          is_active: true,
        }, {
          onConflict: 'user_id,provider'
        });

      if (error) throw error;

      await fetchApiKeys();
      toast.success(`${provider.toUpperCase()} API key saved successfully`);
      return { error: null };
    } catch (error) {
      console.error('Error saving API key:', error);
      toast.error('Failed to save API key');
      return { error };
    }
  };

  const deleteApiKey = async (provider: ApiKeyProvider) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;

      await fetchApiKeys();
      toast.success(`${provider.toUpperCase()} API key removed`);
      return { error: null };
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast.error('Failed to delete API key');
      return { error };
    }
  };

  const toggleApiKey = async (provider: ApiKeyProvider, isActive: boolean) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('user_api_keys')
        .update({ is_active: isActive })
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;

      await fetchApiKeys();
      return { error: null };
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast.error('Failed to update API key');
      return { error };
    }
  };

  const getApiKey = (provider: ApiKeyProvider): UserApiKey | undefined => {
    return apiKeys.find(key => key.provider === provider);
  };

  const hasActiveKey = (provider: ApiKeyProvider): boolean => {
    const key = getApiKey(provider);
    return !!key && key.is_active;
  };

  return {
    apiKeys,
    isLoading,
    saveApiKey,
    deleteApiKey,
    toggleApiKey,
    getApiKey,
    hasActiveKey,
    refetch: fetchApiKeys,
  };
};
