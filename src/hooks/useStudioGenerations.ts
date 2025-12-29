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

const PAGE_SIZE = 30;

export const useStudioGenerations = (type?: 'image' | 'video' | 'audio') => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchGenerations = useCallback(async (reset: boolean = true) => {
    if (!user) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      const currentPage = reset ? 0 : page;
      
      let query = supabase
        .from('studio_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const generationsList = (data as StudioGeneration[]) || [];
      setHasMore(generationsList.length === PAGE_SIZE);
      
      if (reset) {
        setGenerations(generationsList);
        setPage(1);
      } else {
        setGenerations(prev => [...prev, ...generationsList]);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching generations:', error);
      toast.error('Failed to load your generations');
    } finally {
      setIsLoading(false);
    }
  }, [user, type, page]);

  useEffect(() => {
    fetchGenerations(true);
  }, [user, type]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchGenerations(false);
    }
  }, [hasMore, isLoading, fetchGenerations]);

  const deleteGeneration = async (id: string) => {
    if (!user) return;

    // Optimistic update
    const generation = generations.find(g => g.id === id);
    setGenerations(prev => prev.filter(g => g.id !== id));

    try {
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

      toast.success('Generation removed successfully');
    } catch (error) {
      // Rollback on failure
      console.error('Error deleting generation:', error);
      if (generation) {
        setGenerations(prev => [generation, ...prev]);
      }
      toast.error('Failed to delete generation');
    }
  };

  const addGeneration = (generation: StudioGeneration) => {
    setGenerations(prev => [generation, ...prev]);
  };

  return {
    generations,
    isLoading,
    hasMore,
    deleteGeneration,
    addGeneration,
    loadMore,
    refetch: () => fetchGenerations(true),
  };
};
