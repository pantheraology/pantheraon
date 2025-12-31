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
  // Runtime signed URL (not stored in DB)
  signedUrl?: string;
}

const PAGE_SIZE = 30;
const SIGNED_URL_EXPIRY = 3600; // 1 hour

/**
 * Generate a signed URL for a storage file path
 */
export const getSignedUrl = async (filePath: string): Promise<string | null> => {
  if (!filePath) return null;
  
  // If it's already a full URL (legacy data), return as-is
  if (filePath.startsWith('http')) {
    return filePath;
  }
  
  const { data, error } = await supabase.storage
    .from('studio-assets')
    .createSignedUrl(filePath, SIGNED_URL_EXPIRY);
  
  if (error) {
    console.error('Error creating signed URL:', error);
    return null;
  }
  
  return data?.signedUrl || null;
};

export const useStudioGenerations = (type?: 'image' | 'video' | 'audio') => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  // Generate signed URLs for generations
  const enrichWithSignedUrls = useCallback(async (gens: StudioGeneration[]): Promise<StudioGeneration[]> => {
    return Promise.all(
      gens.map(async (gen) => {
        if (gen.result_url) {
          const signedUrl = await getSignedUrl(gen.result_url);
          return { ...gen, signedUrl: signedUrl || gen.result_url };
        }
        return gen;
      })
    );
  }, []);

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
      
      // Enrich with signed URLs
      const enrichedGenerations = await enrichWithSignedUrls(generationsList);
      
      if (reset) {
        setGenerations(enrichedGenerations);
        setPage(1);
      } else {
        setGenerations(prev => [...prev, ...enrichedGenerations]);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error('Error fetching generations:', error);
      toast.error('Failed to load your generations');
    } finally {
      setIsLoading(false);
    }
  }, [user, type, page, enrichWithSignedUrls]);

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
      // Delete from storage if we have the file path
      if (generation?.result_url) {
        // result_url now stores file path, not full URL
        const filePath = generation.result_url.startsWith('http')
          ? generation.result_url.split('/studio-assets/')[1] // legacy format
          : generation.result_url; // new format (just the path)
        
        if (filePath) {
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

  const addGeneration = async (generation: StudioGeneration) => {
    // If it has a result_url, get a signed URL for it
    if (generation.result_url) {
      const signedUrl = await getSignedUrl(generation.result_url);
      setGenerations(prev => [{ ...generation, signedUrl: signedUrl || generation.result_url }, ...prev]);
    } else {
      setGenerations(prev => [generation, ...prev]);
    }
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
