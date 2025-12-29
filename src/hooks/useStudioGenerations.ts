import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StudioGeneration {
  id: string;
  user_id: string;
  type: 'image' | 'video' | 'audio';
  prompt: string;
  result_url: string | null;
  settings: Record<string, any>;
  created_at: string;
}

export const useStudioGenerations = (type?: 'image' | 'video' | 'audio') => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGenerations = useCallback(async () => {
    if (!user) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('studio_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      setGenerations((data as StudioGeneration[]) || []);
    } catch (error) {
      console.error('Error fetching generations:', error);
      toast.error('Failed to load your generations');
    } finally {
      setIsLoading(false);
    }
  }, [user, type]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const deleteGeneration = async (id: string) => {
    if (!user) return;

    try {
      // Find the generation to get the file path
      const generation = generations.find(g => g.id === id);
      
      // Delete from storage if we have the URL
      if (generation?.result_url) {
        const urlParts = generation.result_url.split('/studio-assets/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('studio-assets').remove([filePath]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('studio_generations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGenerations(prev => prev.filter(g => g.id !== id));
      toast.success('Generation removed successfully');
    } catch (error) {
      console.error('Error deleting generation:', error);
      toast.error('Failed to delete generation');
    }
  };

  const addGeneration = (generation: StudioGeneration) => {
    setGenerations(prev => [generation, ...prev]);
  };

  return {
    generations,
    isLoading,
    deleteGeneration,
    addGeneration,
    refetch: fetchGenerations,
  };
};
