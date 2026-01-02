import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  fetchGenerations,
  enrichWithSignedUrls,
  getSignedUrl,
  deleteGeneration as deleteGenerationService,
  type StudioGeneration,
} from '@/services/studioGenerations';

// Re-export types and utilities for backward compatibility
export type { StudioGeneration } from '@/services/studioGenerations';
export { getSignedUrl } from '@/services/studioGenerations';

const PAGE_SIZE = 30;

export const useStudioGenerations = (type?: 'image' | 'video' | 'audio') => {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<StudioGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchData = useCallback(async (reset: boolean = true) => {
    if (!user) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      const currentPage = reset ? 0 : page;
      
      const result = await fetchGenerations(
        user.id,
        { page: currentPage, pageSize: PAGE_SIZE },
        type
      );

      setHasMore(result.hasMore);
      
      // Enrich with signed URLs
      const enrichedGenerations = await enrichWithSignedUrls(result.data);
      
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
  }, [user, type, page]);

  useEffect(() => {
    fetchData(true);
  }, [user, type]);

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      await fetchData(false);
    }
  }, [hasMore, isLoading, fetchData]);

  const deleteGeneration = async (id: string) => {
    if (!user) return;

    // Optimistic update
    const generation = generations.find(g => g.id === id);
    setGenerations(prev => prev.filter(g => g.id !== id));

    try {
      await deleteGenerationService(id, user.id, generation?.result_url);
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
    refetch: () => fetchData(true),
  };
};
