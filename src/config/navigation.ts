import { MessageSquare, Compass, LayoutGrid, Library, Users, Bot, Sparkles, Palette, BookMarked, LucideIcon } from 'lucide-react';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  requiresAuth?: boolean;
  isDynamic?: boolean; // For Agent section that changes name
  hidden?: boolean; // Temporarily hide from navigation
}

export const navItems: NavItem[] = [
  { icon: MessageSquare, label: 'Chat', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: Users, label: 'Group Chat', path: '/groups', requiresAuth: true },
  { icon: Bot, label: 'AGENT', path: '/agent', requiresAuth: true, isDynamic: true },
  { icon: Sparkles, label: 'Assistants', path: '/assistants', requiresAuth: true },
  { icon: BookMarked, label: 'Promptbase', path: '/promptbase', requiresAuth: true },
  { icon: Palette, label: 'Studio', path: '/studio', requiresAuth: true, hidden: true },
  { icon: LayoutGrid, label: 'Spaces', path: '/spaces', requiresAuth: true },
  { icon: Library, label: 'Library', path: '/library', requiresAuth: true },
];
