import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useDeviceCapability';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  label?: string;
}

export const FloatingActionButton = ({ 
  onClick, 
  icon = <Plus size={24} />,
  className,
  label = "New chat"
}: FloatingActionButtonProps) => {
  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed bottom-24 right-4 z-40 md:hidden",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-b from-primary to-primary/70",
        "text-primary-foreground shadow-lg shadow-primary/30",
        "flex items-center justify-center",
        "active:scale-95 transition-transform",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        className
      )}
      aria-label={label}
    >
      {icon}
    </button>
  );
};
