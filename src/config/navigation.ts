import { Home, Compass, LayoutGrid, Library, LucideIcon } from 'lucide-react';

export interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
  requiresAuth?: boolean;
}

export const navItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Compass, label: 'Discover', path: '/discover' },
  { icon: LayoutGrid, label: 'Spaces', path: '/spaces', requiresAuth: true },
  { icon: Library, label: 'Library', path: '/library', requiresAuth: true },
];
