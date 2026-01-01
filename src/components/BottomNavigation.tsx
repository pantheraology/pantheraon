import { Link, useLocation } from 'react-router-dom';
import { Package, Sparkles, Users, Bot, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { triggerHaptic } from '@/hooks/useDeviceCapability';

const navItems = [
  { icon: Package, label: 'Inventory', path: '/library', requiresAuth: true },
  { icon: Sparkles, label: 'Assistants', path: '/assistants', requiresAuth: true },
  { icon: Users, label: 'Groups', path: '/groups', requiresAuth: true },
  { icon: Bot, label: 'Agent', path: '/agent', requiresAuth: true },
];

interface BottomNavigationProps {
  onNewChat?: () => void;
}

export const BottomNavigation = ({ onNewChat }: BottomNavigationProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const visibleItems = navItems.filter(item => !item.requiresAuth || user);

  const handleNavClick = () => {
    triggerHaptic('light');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/50 pb-safe md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all",
                isActive && "bg-primary/20"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Center FAB for New Chat */}
        {onNewChat && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onNewChat();
            }}
            className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-gradient-to-b from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/30 active:scale-95 transition-transform"
            aria-label="New chat"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        )}

        {visibleItems.slice(2, 4).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[64px] min-h-[44px] rounded-xl transition-all",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-lg transition-all",
                isActive && "bg-primary/20"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
