/**
 * Base Service Layer
 * Provides common patterns for Supabase operations
 */

import { supabase } from '@/integrations/supabase/client';
import { handleError, withErrorHandling } from '@/lib/errors';

export { supabase };

/**
 * Generic database query wrapper with error handling
 */
export async function dbQuery<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>,
  context?: string
): Promise<T | null> {
  const { data, error } = await operation();
  
  if (error) {
    handleError(error, context);
    return null;
  }
  
  return data;
}

/**
 * Generic database mutation wrapper with error handling
 */
export async function dbMutate<T>(
  operation: () => Promise<{ data: T | null; error: { message: string } | null }>,
  context?: string,
  options?: { silent?: boolean; successMessage?: string }
): Promise<{ data: T | null; success: boolean }> {
  const { data, error } = await operation();
  
  if (error) {
    if (!options?.silent) {
      handleError(error, context);
    }
    return { data: null, success: false };
  }
  
  return { data, success: true };
}

/**
 * Paginated query helper
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  hasMore: boolean;
  nextPage: number;
}

export function getPaginationRange(params: PaginationParams): { from: number; to: number } {
  const { page, pageSize } = params;
  return {
    from: page * pageSize,
    to: (page + 1) * pageSize - 1,
  };
}

/**
 * Check if user is authenticated
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Storage upload helper
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
  options?: { upsert?: boolean }
): Promise<{ path: string | null; error: Error | null }> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: options?.upsert });

  if (error) {
    handleError(error, `Upload to ${bucket}`);
    return { path: null, error };
  }

  return { path: data.path, error: null };
}

/**
 * Storage delete helper
 */
export async function deleteFile(
  bucket: string,
  paths: string[]
): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    handleError(error, `Delete from ${bucket}`);
    return false;
  }

  return true;
}
