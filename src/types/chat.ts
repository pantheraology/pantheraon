/**
 * Chat-related type definitions
 * Centralized location for all chat types
 */

// Chat modes
export type ChatMode = 'normal' | 'research' | 'thinking';

// File attachment for chat
export interface ChatAttachment {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

// Uploaded file after processing
export interface UploadedFile {
  url: string;
  type: 'image' | 'document';
  name: string;
  mimeType: string;
}

// Options for sending a chat message
export interface ChatOptions {
  mode?: ChatMode;
  model?: string;
  agentId?: string;
  attachments?: ChatAttachment[];
}
