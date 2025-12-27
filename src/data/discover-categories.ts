import { Sparkles, Zap, Globe, BookOpen, Music, LucideIcon } from 'lucide-react';

export interface DiscoverCategory {
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
}

export const discoverCategories: DiscoverCategory[] = [
  { 
    icon: Sparkles, 
    title: 'Creative Writing', 
    description: 'Generate stories, poems, and creative content',
    color: 'from-purple-500 to-pink-500'
  },
  { 
    icon: Zap, 
    title: 'Productivity', 
    description: 'Get help with tasks, planning, and organization',
    color: 'from-yellow-500 to-orange-500'
  },
  { 
    icon: Globe, 
    title: 'Research', 
    description: 'Explore topics and get detailed information',
    color: 'from-primary to-accent'
  },
  { 
    icon: BookOpen, 
    title: 'Learning', 
    description: 'Learn new skills and concepts interactively',
    color: 'from-green-500 to-emerald-500'
  },
  { 
    icon: Music, 
    title: 'Entertainment', 
    description: 'Fun conversations, games, and trivia',
    color: 'from-rose-500 to-red-500'
  },
];
