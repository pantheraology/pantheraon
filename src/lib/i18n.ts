/**
 * Internationalization (i18n) Foundation
 * Simple translation system with pluralization support
 */

export type Locale = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'zh' | 'ja';

export interface TranslationStrings {
  // Common
  'common.loading': string;
  'common.error': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;
  'common.create': string;
  'common.search': string;
  'common.noResults': string;
  'common.retry': string;
  'common.undo': string;
  
  // Auth
  'auth.signIn': string;
  'auth.signUp': string;
  'auth.signOut': string;
  'auth.email': string;
  'auth.password': string;
  'auth.forgotPassword': string;
  'auth.createAccount': string;
  
  // Chat
  'chat.newChat': string;
  'chat.typeMessage': string;
  'chat.thinking': string;
  'chat.noConversations': string;
  'chat.deleteConversation': string;
  'chat.conversationDeleted': string;
  
  // Agent
  'agent.create': string;
  'agent.name': string;
  'agent.description': string;
  'agent.instructions': string;
  'agent.capabilities': string;
  
  // Studio
  'studio.generate': string;
  'studio.generating': string;
  'studio.image': string;
  'studio.video': string;
  'studio.audio': string;
  
  // Navigation
  'nav.home': string;
  'nav.discover': string;
  'nav.groups': string;
  'nav.assistants': string;
  'nav.studio': string;
  'nav.spaces': string;
  'nav.library': string;
  'nav.settings': string;
  
  // Errors
  'error.generic': string;
  'error.network': string;
  'error.unauthorized': string;
  'error.notFound': string;
  'error.rateLimit': string;
}

// English translations (default)
const en: TranslationStrings = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.create': 'Create',
  'common.search': 'Search',
  'common.noResults': 'No results found',
  'common.retry': 'Retry',
  'common.undo': 'Undo',
  
  // Auth
  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',
  'auth.signOut': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.forgotPassword': 'Forgot password?',
  'auth.createAccount': 'Create account',
  
  // Chat
  'chat.newChat': 'New Chat',
  'chat.typeMessage': 'Type your message...',
  'chat.thinking': 'Thinking...',
  'chat.noConversations': 'No conversations yet',
  'chat.deleteConversation': 'Delete conversation',
  'chat.conversationDeleted': 'Conversation deleted',
  
  // Agent
  'agent.create': 'Create Agent',
  'agent.name': 'Agent Name',
  'agent.description': 'Description',
  'agent.instructions': 'Instructions',
  'agent.capabilities': 'Capabilities',
  
  // Studio
  'studio.generate': 'Generate',
  'studio.generating': 'Generating...',
  'studio.image': 'Image',
  'studio.video': 'Video',
  'studio.audio': 'Audio',
  
  // Navigation
  'nav.home': 'Home',
  'nav.discover': 'Discover',
  'nav.groups': 'Groups',
  'nav.assistants': 'Assistants',
  'nav.studio': 'Studio',
  'nav.spaces': 'Spaces',
  'nav.library': 'Library',
  'nav.settings': 'Settings',
  
  // Errors
  'error.generic': 'Something went wrong. Please try again.',
  'error.network': 'Network error. Please check your connection.',
  'error.unauthorized': 'Please sign in to continue.',
  'error.notFound': 'The requested resource was not found.',
  'error.rateLimit': 'Too many requests. Please wait a moment.',
};

// Translation storage
const translations: Record<Locale, TranslationStrings> = {
  en,
  es: en, // Placeholder - would be Spanish translations
  fr: en, // Placeholder - would be French translations
  de: en, // Placeholder - would be German translations
  pt: en, // Placeholder - would be Portuguese translations
  zh: en, // Placeholder - would be Chinese translations
  ja: en, // Placeholder - would be Japanese translations
};

// Current locale
let currentLocale: Locale = 'en';

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
  // Persist to localStorage
  try {
    localStorage.setItem('locale', locale);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Initialize locale from browser or storage
 */
export function initializeLocale(): Locale {
  // Try to get from localStorage
  try {
    const stored = localStorage.getItem('locale') as Locale | null;
    if (stored && translations[stored]) {
      currentLocale = stored;
      return currentLocale;
    }
  } catch {
    // Ignore storage errors
  }

  // Try to detect from browser
  const browserLang = navigator.language.split('-')[0] as Locale;
  if (translations[browserLang]) {
    currentLocale = browserLang;
  }

  return currentLocale;
}

/**
 * Get a translated string
 */
export function t(key: keyof TranslationStrings): string {
  return translations[currentLocale]?.[key] ?? translations.en[key] ?? key;
}

/**
 * Get a translated string with interpolation
 */
export function tWithParams(
  key: keyof TranslationStrings,
  params: Record<string, string | number>
): string {
  let text = t(key);
  
  for (const [paramKey, value] of Object.entries(params)) {
    text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value));
  }
  
  return text;
}

/**
 * Pluralization helper
 */
export function plural(
  count: number,
  singular: string,
  plural: string
): string {
  return count === 1 ? singular : plural;
}

/**
 * Format a number according to locale
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat(currentLocale).format(num);
}

/**
 * Format a date according to locale
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(currentLocale, options).format(d);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(currentLocale, { numeric: 'auto' });
  
  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  }
  if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  }
  if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  }
  if (diffInSeconds < 604800) {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
  if (diffInSeconds < 2592000) {
    return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
  }
  if (diffInSeconds < 31536000) {
    return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  }
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
}
