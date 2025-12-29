/**
 * Prompts Service
 * Encapsulates all Supabase operations for saved prompts
 */

import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Use Supabase generated types
type DbPrompt = Tables<'saved_prompts'>;
type PromptInsert = TablesInsert<'saved_prompts'>;
type PromptUpdate = TablesUpdate<'saved_prompts'>;

export interface CreatePromptParams {
  userId: string;
  title: string;
  content: string;
  category?: string | null;
}

export interface UpdatePromptParams {
  title?: string;
  content?: string;
  category?: string | null;
}

/**
 * Fetch all prompts for a user
 */
export async function fetchPrompts(userId: string): Promise<DbPrompt[]> {
  const { data, error } = await supabase
    .from('saved_prompts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create a new prompt
 */
export async function createPrompt(params: CreatePromptParams): Promise<DbPrompt> {
  const { userId, title, content, category } = params;

  const { data, error } = await supabase
    .from('saved_prompts')
    .insert({
      user_id: userId,
      title,
      content,
      category: category || null,
    } as PromptInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing prompt
 */
export async function updatePrompt(
  promptId: string,
  updates: UpdatePromptParams
): Promise<DbPrompt> {
  const { data, error } = await supabase
    .from('saved_prompts')
    .update(updates as PromptUpdate)
    .eq('id', promptId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a prompt
 */
export async function deletePrompt(promptId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_prompts')
    .delete()
    .eq('id', promptId);

  if (error) throw error;
}

/**
 * Fetch a single prompt by ID
 */
export async function fetchPromptById(promptId: string): Promise<DbPrompt | null> {
  const { data, error } = await supabase
    .from('saved_prompts')
    .select('*')
    .eq('id', promptId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
