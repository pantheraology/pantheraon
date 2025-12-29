// Centralized UI messages - prepare for future i18n
import { BRAND } from './brand';

export const MESSAGES = {
  // Auth
  AUTH: {
    SIGN_IN_REQUIRED: 'Please sign in to continue',
    SIGN_IN_SUCCESS: 'Signed in successfully',
    SIGN_OUT_SUCCESS: 'Signed out successfully',
    SIGN_UP_SUCCESS: 'Account created! Check your email to confirm.',
  },
  
  // Errors
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'The requested resource was not found.',
    RATE_LIMIT: 'Rate limit exceeded. Please try again in a moment.',
    PAYMENT_REQUIRED: 'Usage limit reached. Please add credits to continue.',
  },
  
  // Success
  SUCCESS: {
    SAVED: 'Changes saved successfully',
    DELETED: 'Deleted successfully',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
  },
  
  // Empty states
  EMPTY: {
    CONVERSATIONS: 'No conversations yet',
    CONVERSATIONS_DESC: 'Start a new conversation to see it here',
    SPACES: 'No spaces yet',
    SPACES_DESC: 'Create your first space to organize conversations',
    GROUPS: 'No group chats yet',
    GROUPS_DESC: 'Create a group to start collaborating with others',
    ASSISTANTS: 'No assistants yet',
    ASSISTANTS_DESC: 'Create custom assistants for specific tasks',
    SEARCH_NO_RESULTS: 'No results found',
    SEARCH_TRY_AGAIN: 'Try a different search term',
  },
  
  // Chat
  CHAT: {
    PLACEHOLDER: `Message ${BRAND.AI_NAME}...`,
    THINKING: `${BRAND.AI_NAME} is thinking...`,
    ERROR: 'Failed to send message. Please try again.',
  },
  
  // Studio
  STUDIO: {
    GENERATING: 'Generating...',
    GENERATION_COMPLETE: 'Generation complete!',
    GENERATION_ERROR: 'Failed to generate. Please try again.',
  },
} as const;
