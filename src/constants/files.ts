/**
 * File upload constants
 * Centralized configuration for file handling
 */

// Accepted file types for chat attachments
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

export const ACCEPTED_DOC_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Combined accepted types for file input
export const ACCEPTED_FILE_TYPES = [...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_DOC_TYPES] as const;

// File size limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;

// Storage bucket names
export const STORAGE_BUCKETS = {
  CHAT_ATTACHMENTS: 'chat-attachments',
  AVATARS: 'avatars',
  AGENT_KNOWLEDGE: 'agent-knowledge',
} as const;

// Signed URL expiration (in seconds)
export const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

/**
 * Check if a file type is an accepted image
 */
export const isAcceptedImageType = (type: string): boolean => 
  ACCEPTED_IMAGE_TYPES.includes(type as typeof ACCEPTED_IMAGE_TYPES[number]);

/**
 * Check if a file type is an accepted document
 */
export const isAcceptedDocType = (type: string): boolean => 
  ACCEPTED_DOC_TYPES.includes(type as typeof ACCEPTED_DOC_TYPES[number]);

/**
 * Check if a file type is accepted (image or document)
 */
export const isAcceptedFileType = (type: string): boolean => 
  isAcceptedImageType(type) || isAcceptedDocType(type);
