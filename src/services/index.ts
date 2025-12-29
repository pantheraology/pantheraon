/**
 * Services barrel export
 * Provides a centralized service layer for data operations
 */

export {
  supabase,
  dbQuery,
  dbMutate,
  getPaginationRange,
  getCurrentUser,
  uploadFile,
  deleteFile,
  type PaginationParams,
  type PaginatedResult,
} from './base';

// Domain services
export * as conversationsService from './conversations';
export * as agentsService from './agents';
export * as promptsService from './prompts';
