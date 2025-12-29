import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeName = 'space-blue' | 'neon-orange' | 'cyber-yellow' | 'aqua-cyan';

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'app-theme';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return (stored as ThemeName) || 'space-blue';
  });

  useEffect(() => {
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
    
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
