import { ReactNode, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export const PullToRefresh = ({ children, onRefresh, className }: PullToRefreshProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    isPulling,
    isRefreshing,
    pullDistance,
    pullProgress,
    handlers,
    setScrollableRef,
  } = usePullToRefresh({ onRefresh });

  return (
    <div
      ref={(el) => {
        if (el) {
          setScrollableRef(el);
        }
      }}
      className={cn("relative overflow-auto", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 flex items-center justify-center transition-all z-10",
          (isPulling || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: pullDistance - 40,
          transform: `translateX(-50%) rotate(${pullProgress * 360}deg)`,
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg",
          isRefreshing && "animate-spin"
        )}>
          <RefreshCw 
            size={20} 
            className={cn(
              "text-primary transition-transform",
              pullProgress >= 1 && "scale-110"
            )} 
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        ref={containerRef}
        style={{
          transform: isPulling || isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: !isPulling ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};
