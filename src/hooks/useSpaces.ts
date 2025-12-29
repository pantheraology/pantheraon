import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Space {
  id: string;
  name: string;
  icon: string | null;
  createdAt: Date;
}

interface DbSpace {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
}

export const useSpaces = () => {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch spaces from database
  const fetchSpaces = useCallback(async () => {
    if (!user) {
      setSpaces([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const parsedSpaces: Space[] = (data as DbSpace[]).map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        createdAt: new Date(s.created_at),
      }));

      setSpaces(parsedSpaces);
    } catch (error) {
      console.error('Failed to fetch spaces:', error);
      toast.error('Failed to load spaces');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const createSpace = useCallback(async (name: string): Promise<Space | null> => {
    if (!user) {
      toast.error('Please sign in to create spaces');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('spaces')
        .insert({ name, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      const newSpace: Space = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        createdAt: new Date(data.created_at),
      };

      setSpaces((prev) => [newSpace, ...prev]);
      return newSpace;
    } catch (error) {
      console.error('Failed to create space:', error);
      toast.error('Failed to create space');
      return null;
    }
  }, [user]);

  const deleteSpace = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSpaces((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to delete space:', error);
      toast.error('Failed to delete space');
    }
  }, [user]);

  const getSpace = useCallback((id: string): Space | undefined => {
    return spaces.find((s) => s.id === id);
  }, [spaces]);

  return {
    spaces,
    isLoading,
    createSpace,
    deleteSpace,
    getSpace,
    refetch: fetchSpaces,
  };
};
