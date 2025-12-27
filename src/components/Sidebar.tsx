import { Apple, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { navItems } from '@/config/navigation';
import { SIDEBAR_WIDTH } from '@/constants/layout';

export const Sidebar = () => {
  const location = useLocation();

  return (
    <div 
      className="h-screen bg-sidebar flex flex-col justify-between py-6 px-4 fixed left-0 top-0 z-20 border-r border-border/50"
      style={{ width: SIDEBAR_WIDTH }}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-primary/80 via-primary to-primary/60 shadow-[0_0_38px_hsl(var(--primary)/0.45)] flex items-center justify-center text-foreground font-bold">
            O
          </div>
          <span className="text-foreground font-medium text-lg tracking-wide">Ombrion AI</span>
          <button className="ml-auto w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors">
            <Menu size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 mt-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 w-full rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-[radial-gradient(85.38%_270.12%_at_0%_50%,hsl(var(--primary))_0%,hsl(var(--primary)/0.7)_35%,hsl(var(--primary)/0.4)_75%,hsl(var(--primary)/0.25)_100%)] text-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon size={18} />
                <span className="font-medium text-[15px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-4">
        {/* Ad / Info */}
        <div className="px-2">
          <p className="text-muted-foreground text-sm mb-4">Powered by Lovable AI</p>
        </div>

        {/* Buttons */}
        <button className="w-full py-2.5 rounded-lg bg-gradient-to-b from-primary to-primary/60 text-primary-foreground font-medium text-[15px] shadow-lg hover:brightness-110 transition-all">
          Sign up
        </button>
        
        <button className="w-full py-2.5 rounded-lg bg-muted/50 border border-border text-foreground font-medium text-[15px] hover:bg-muted transition-all">
          Log in
        </button>

        {/* Download */}
        <div className="flex items-center justify-center gap-2 mt-2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
          <Apple size={16} className="text-foreground" />
          <span className="text-foreground text-sm font-medium">Download for Mac</span>
        </div>
      </div>
    </div>
  );
};
