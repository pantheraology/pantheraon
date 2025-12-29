import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type ThemeName = 'space-blue' | 'neon-orange' | 'cyber-yellow' | 'aqua-cyan';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

const applyThemeClass = (theme: ThemeName) => {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove('theme-orange', 'theme-yellow', 'theme-cyan');
  
  // Add the appropriate theme class (space-blue uses default :root)
  if (theme === 'neon-orange') {
    root.classList.add('theme-orange');
  } else if (theme === 'cyber-yellow') {
    root.classList.add('theme-yellow');
  } else if (theme === 'aqua-cyan') {
    root.classList.add('theme-cyan');
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'space-blue';
  });

  // Load theme from database when user is authenticated
  useEffect(() => {
    const loadThemeFromDatabase = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('theme_preference')
          .eq('id', user.id)
          .maybeSingle();

        if (data?.theme_preference) {
          const dbTheme = data.theme_preference as ThemeName;
          setThemeState(dbTheme);
          localStorage.setItem(THEME_STORAGE_KEY, dbTheme);
          applyThemeClass(dbTheme);
        }
      } catch (error) {
        console.error('Error loading theme from database:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemeFromDatabase();
  }, [user]);

  // Apply theme class whenever theme changes
  useEffect(() => {
    applyThemeClass(theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    applyThemeClass(newTheme);

    // Save to database if user is authenticated
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_preference: newTheme })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error saving theme to database:', error);
      }
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
