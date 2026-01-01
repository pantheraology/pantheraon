import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const MobileMenuButton = ({ isOpen, onClick, className }: MobileMenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "md:hidden fixed top-1/2 -translate-y-1/2 right-0 z-50 w-10 h-12 rounded-l-xl rounded-r-none glass flex items-center justify-center transition-all duration-200 hover:bg-muted shadow-lg",
        className
      )}
      aria-label={isOpen ? "Close menu" : "Open menu"}
    >
      {isOpen ? (
        <X size={20} className="text-foreground" />
      ) : (
        <Menu size={20} className="text-foreground" />
      )}
    </button>
  );
};
