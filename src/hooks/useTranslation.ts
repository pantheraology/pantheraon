import { useState, useCallback, useEffect } from 'react';
import { 
  t, 
  tWithParams, 
  getLocale, 
  setLocale, 
  initializeLocale,
  formatDate,
  formatNumber,
  formatRelativeTime,
  plural,
  Locale,
  TranslationStrings
} from '@/lib/i18n';

/**
 * Hook to use translations in components
 */
export function useTranslation() {
  const [locale, setCurrentLocale] = useState<Locale>(() => initializeLocale());

  const changeLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    setCurrentLocale(newLocale);
  }, []);

  return {
    t,
    tWithParams,
    locale,
    setLocale: changeLocale,
    formatDate,
    formatNumber,
    formatRelativeTime,
    plural,
  };
}

/**
 * Simple hook just for translation function
 */
export function useT() {
  return t;
}

/**
 * Hook to get a specific translation
 */
export function useTranslationKey(key: keyof TranslationStrings): string {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    // Force re-render if locale changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'locale') {
        forceUpdate({});
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return t(key);
}
