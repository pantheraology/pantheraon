import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={cn(
        prefersReducedMotion ? '' : 'animate-fade-in',
        className
      )}
    >
      {children}
    </div>
  );
};
