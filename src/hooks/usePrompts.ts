import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SavedPrompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptData {
  title: string;
  content: string;
  category?: string;
}

export interface UpdatePromptData {
  id: string;
  title?: string;
  content?: string;
  category?: string | null;
}

export const usePrompts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading, error } = useQuery({
    queryKey: ['saved-prompts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SavedPrompt[];
    },
    enabled: !!user,
  });

  const createPrompt = useMutation({
    mutationFn: async (data: CreatePromptData) => {
      if (!user) throw new Error('Must be logged in');

      const { data: newPrompt, error } = await supabase
        .from('saved_prompts')
        .insert({
          user_id: user.id,
          title: data.title,
          content: data.content,
          category: data.category || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newPrompt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-prompts'] });
      toast.success('Prompt saved');
    },
    onError: (error) => {
      toast.error('Failed to save prompt');
      console.error('Create prompt error:', error);
    },
  });

  const updatePrompt = useMutation({
    mutationFn: async (data: UpdatePromptData) => {
      const { id, ...updates } = data;
      
      const { data: updated, error } = await supabase
        .from('saved_prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-prompts'] });
      toast.success('Prompt updated');
    },
    onError: (error) => {
      toast.error('Failed to update prompt');
      console.error('Update prompt error:', error);
    },
  });

  const deletePrompt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('saved_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-prompts'] });
      toast.success('Prompt deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete prompt');
      console.error('Delete prompt error:', error);
    },
  });

  return {
    prompts,
    isLoading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
  };
};
