/**
 * Spaces Service
 * Encapsulates all Supabase operations for spaces
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';
import { Space } from '@/types';

type DbSpace = Tables<'spaces'>;
type SpaceInsert = TablesInsert<'spaces'>;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Transform DB space to app space
const toSpace = (dbSpace: DbSpace): Space => ({
  id: dbSpace.id,
  name: dbSpace.name,
  icon: dbSpace.icon,
  createdAt: new Date(dbSpace.created_at!),
});

/**
 * Fetch paginated spaces for a user
 */
export async function fetchSpaces(
  userId: string,
  params?: PaginationParams
): Promise<{ data: Space[]; hasMore: boolean }> {
  const pageSize = params?.pageSize ?? 50;
  const page = params?.page ?? 0;
  const from = page * pageSize;
  const to = (page + 1) * pageSize - 1;

  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const spaces = data || [];
  return {
    data: spaces.map(toSpace),
    hasMore: spaces.length === pageSize,
  };
}

/**
 * Create a new space
 */
export async function createSpace(
  userId: string,
  name: string,
  icon?: string
): Promise<Space> {
  const { data, error } = await supabase
    .from('spaces')
    .insert({ 
      name, 
      user_id: userId,
      icon: icon ?? null,
    } as SpaceInsert)
    .select()
    .single();

  if (error) throw error;
  return toSpace(data);
}

/**
 * Update a space
 */
export async function updateSpace(
  spaceId: string,
  updates: { name?: string; icon?: string }
): Promise<void> {
  const { error } = await supabase
    .from('spaces')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', spaceId);

  if (error) throw error;
}

/**
 * Delete a space
 */
export async function deleteSpace(spaceId: string): Promise<void> {
  const { error } = await supabase
    .from('spaces')
    .delete()
    .eq('id', spaceId);

  if (error) throw error;
}

/**
 * Get a single space by ID
 */
export async function getSpaceById(spaceId: string): Promise<Space | null> {
  const { data, error } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', spaceId)
    .maybeSingle();

  if (error) throw error;
  return data ? toSpace(data) : null;
}
