/**
 * Studio Generations Service
 * Encapsulates all Supabase operations for studio generations
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type DbGeneration = Tables<'studio_generations'>;

export interface StudioGeneration {
  id: string;
  user_id?: string;
  prompt: string;
  result_url: string | null;
  type: 'image' | 'video' | 'audio';
  settings: Record<string, unknown> | null;
  created_at: string;
  // Runtime signed URL (not stored in DB)
  signedUrl?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Transform DB generation to app generation
const toGeneration = (db: DbGeneration): StudioGeneration => ({
  id: db.id,
  user_id: db.user_id,
  prompt: db.prompt,
  result_url: db.result_url,
  type: db.type as 'image' | 'video' | 'audio',
  settings: db.settings as Record<string, unknown> | null,
  created_at: db.created_at,
});

/**
 * Generate a signed URL for a storage file path
 */
export async function getSignedUrl(filePath: string): Promise<string | null> {
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
}

/**
 * Enrich generations with signed URLs
 */
export async function enrichWithSignedUrls(
  generations: StudioGeneration[]
): Promise<StudioGeneration[]> {
  return Promise.all(
    generations.map(async (gen) => {
      if (gen.result_url) {
        const signedUrl = await getSignedUrl(gen.result_url);
        return { ...gen, signedUrl: signedUrl || gen.result_url };
      }
      return gen;
    })
  );
}

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

  const generations = (data || []).map(toGeneration);
  return {
    data: generations,
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
 * Delete a generation (includes storage cleanup)
 */
export async function deleteGeneration(
  generationId: string,
  userId: string,
  resultUrl?: string | null
): Promise<void> {
  // Delete from storage if we have the file path
  if (resultUrl) {
    const filePath = resultUrl.startsWith('http')
      ? resultUrl.split('/studio-assets/')[1] // legacy format
      : resultUrl; // new format (just the path)
    
    if (filePath) {
      await supabase.storage.from('studio-assets').remove([filePath]);
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('studio_generations')
    .delete()
    .eq('id', generationId)
    .eq('user_id', userId);

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
