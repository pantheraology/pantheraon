import { LayoutGrid, Compass, Heart, BookOpen, Trophy, LucideIcon } from 'lucide-react';

export interface SuggestionChip {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

export const defaultSuggestions: SuggestionChip[] = [
  { icon: LayoutGrid, label: 'Parenting', prompt: 'Give me some tips for better parenting' },
  { icon: Compass, label: 'Current Events', prompt: 'What are the latest news and current events?' },
  { icon: Heart, label: 'Health', prompt: 'Give me health and wellness advice' },
  { icon: BookOpen, label: 'Research', prompt: 'Help me research a topic' },
  { icon: Trophy, label: 'Sports', prompt: 'Tell me about recent sports news' },
];
