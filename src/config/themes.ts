// Theme configuration - single source of truth for available themes
import type { ThemeName } from '@/contexts/ThemeContext';

export interface ThemeConfig {
  id: ThemeName;
  name: string;
  color: string;
}

export const THEMES: ThemeConfig[] = [
  { id: 'space-blue', name: 'Space Blue', color: 'hsl(220, 90%, 50%)' },
  { id: 'neon-orange', name: 'Neon Orange', color: 'hsl(14, 100%, 50%)' },
  { id: 'cyber-yellow', name: 'Cyber Yellow', color: 'hsl(75, 100%, 50%)' },
  { id: 'aqua-cyan', name: 'Aqua Cyan', color: 'hsl(187, 94%, 43%)' },
] as const;

export const DEFAULT_THEME: ThemeName = 'space-blue';
