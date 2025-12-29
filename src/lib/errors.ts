/**
 * Centralized Error Handling System
 * Provides consistent error handling across the application
 */

import { toast } from 'sonner';

/**
 * Application error types
 */
export type ErrorType = 
  | 'auth'
  | 'network'
  | 'validation'
  | 'database'
  | 'storage'
  | 'rate_limit'
  | 'permission'
  | 'not_found'
  | 'unknown';

/**
 * Structured application error
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly type: ErrorType = 'unknown',
    public readonly originalError?: unknown,
    public readonly userMessage?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Error messages for users (non-technical)
 */
const USER_MESSAGES: Record<ErrorType, string> = {
  auth: 'Please sign in to continue',
  network: 'Connection error. Please check your internet and try again',
  validation: 'Please check your input and try again',
  database: 'Something went wrong. Please try again',
  storage: 'Failed to process file. Please try again',
  rate_limit: 'Too many requests. Please wait a moment',
  permission: 'You don\'t have permission for this action',
  not_found: 'The requested item was not found',
  unknown: 'Something went wrong. Please try again',
};

/**
 * Detect error type from error object
 */
export function detectErrorType(error: unknown): ErrorType {
  if (!error) return 'unknown';
  
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const code = (error as { code?: string })?.code?.toLowerCase() ?? '';
  const status = (error as { status?: number })?.status;

  // Auth errors
  if (
    message.includes('auth') ||
    message.includes('login') ||
    message.includes('sign in') ||
    message.includes('unauthorized') ||
    code.includes('auth') ||
    status === 401
  ) {
    return 'auth';
  }

  // Rate limiting
  if (
    message.includes('rate limit') ||
    message.includes('too many') ||
    status === 429
  ) {
    return 'rate_limit';
  }

  // Permission errors
  if (
    message.includes('permission') ||
    message.includes('forbidden') ||
    message.includes('row-level security') ||
    message.includes('rls') ||
    status === 403
  ) {
    return 'permission';
  }

  // Not found
  if (
    message.includes('not found') ||
    message.includes('no rows') ||
    status === 404
  ) {
    return 'not_found';
  }

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout')
  ) {
    return 'network';
  }

  // Storage errors
  if (
    message.includes('storage') ||
    message.includes('upload') ||
    message.includes('file')
  ) {
    return 'storage';
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('validation') ||
    status === 400
  ) {
    return 'validation';
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('postgres') ||
    message.includes('duplicate') ||
    message.includes('constraint')
  ) {
    return 'database';
  }

  return 'unknown';
}

/**
 * Handle error with consistent logging and user feedback
 */
export function handleError(
  error: unknown,
  context?: string,
  options?: {
    silent?: boolean;
    customMessage?: string;
    showToast?: boolean;
  }
): AppError {
  const { silent = false, customMessage, showToast = true } = options ?? {};
  
  const type = detectErrorType(error);
  const userMessage = customMessage ?? USER_MESSAGES[type];
  
  const appError = new AppError(
    error instanceof Error ? error.message : String(error),
    type,
    error,
    userMessage
  );

  // Log to console for debugging
  if (!silent) {
    console.error(`[${type.toUpperCase()}]${context ? ` ${context}:` : ''}`, error);
  }

  // Show toast notification
  if (showToast && !silent) {
    toast.error(userMessage);
  }

  return appError;
}

/**
 * Wrapper for async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string,
  options?: {
    silent?: boolean;
    customMessage?: string;
    showToast?: boolean;
    fallback?: T;
  }
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = handleError(error, context, options);
    return { data: options?.fallback ?? null, error: appError };
  }
}

/**
 * Create a typed error for throwing
 */
export function createError(
  message: string,
  type: ErrorType = 'unknown'
): AppError {
  return new AppError(message, type);
}

/**
 * Check if error requires re-authentication
 */
export function isAuthError(error: unknown): boolean {
  return detectErrorType(error) === 'auth';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const type = detectErrorType(error);
  return type === 'network' || type === 'rate_limit';
}
