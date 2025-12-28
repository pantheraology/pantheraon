import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full',
};

export const PageContainer = ({ 
  children, 
  className,
  maxWidth = '4xl' 
}: PageContainerProps) => {
  return (
    <div className={cn(
      "relative z-10 flex-1 overflow-y-auto px-6 md:px-10 py-10",
      className
    )}>
      <div className={cn("mx-auto", maxWidthClasses[maxWidth])}>
        {children}
      </div>
    </div>
  );
};
