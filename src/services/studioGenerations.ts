/**
 * Studio Generations Service
 * Encapsulates all Supabase operations for studio generations
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type DbGeneration = Tables<'studio_generations'>;

export interface StudioGeneration {
  id: string;
  prompt: string;
  result_url: string | null;
  type: 'image' | 'video' | 'audio';
  settings: Record<string, unknown> | null;
  created_at: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Transform DB generation to app generation
const toGeneration = (db: DbGeneration): StudioGeneration => ({
  id: db.id,
  prompt: db.prompt,
  result_url: db.result_url,
  type: db.type as 'image' | 'video' | 'audio',
  settings: db.settings as Record<string, unknown> | null,
  created_at: db.created_at,
});

/**
 * Fetch paginated generations for a user
 */
export async function fetchGenerations(
  userId: string,
  params: PaginationParams,
  type?: 'image' | 'video' | 'audio'
): Promise<{ data: StudioGeneration[]; hasMore: boolean }> {
  const { page, pageSize } = params;
  const from = page * pageSize;
  const to = (page + 1) * pageSize - 1;

  let query = supabase
    .from('studio_generations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;

  if (error) throw error;

  const generations = data || [];
  return {
    data: generations.map(toGeneration),
    hasMore: generations.length === pageSize,
  };
}

/**
 * Fetch a single generation by ID
 */
export async function fetchGenerationById(
  generationId: string
): Promise<StudioGeneration | null> {
  const { data, error } = await supabase
    .from('studio_generations')
    .select('*')
    .eq('id', generationId)
    .maybeSingle();

  if (error) throw error;
  return data ? toGeneration(data) : null;
}

/**
 * Delete a generation
 */
export async function deleteGeneration(generationId: string): Promise<void> {
  const { error } = await supabase
    .from('studio_generations')
    .delete()
    .eq('id', generationId);

  if (error) throw error;
}

/**
 * Delete multiple generations
 */
export async function deleteGenerations(generationIds: string[]): Promise<void> {
  const { error } = await supabase
    .from('studio_generations')
    .delete()
    .in('id', generationIds);

  if (error) throw error;
}
