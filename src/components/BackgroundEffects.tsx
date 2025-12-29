import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

export const BackgroundEffects = () => {
  const prefersReducedMotion = useReducedMotion();
  const { isLowEnd, isTouchDevice } = useDeviceCapability();

  // Reduce star count for mobile/low-end devices
  const starCount = isLowEnd || isTouchDevice ? 20 : 60;

  // Generate stars once on mount
  const stars = useMemo(() => {
    if (prefersReducedMotion) return [];
    
    return [...Array(starCount)].map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() > 0.9 ? '3px' : Math.random() > 0.7 ? '2px' : '1px',
      opacity: 0.3 + Math.random() * 0.7,
      delay: `${Math.random() * 5}s`,
    }));
  }, [starCount, prefersReducedMotion]);

  if (prefersReducedMotion) {
    // Simple static background for reduced motion
    return (
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.05),hsl(var(--background)))]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep Space Background Base */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Radial Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),hsl(var(--background)))]" />

      {/* Sun Effect (Left Top) - GPU accelerated */}
      <div 
        className="absolute top-[20%] left-[25%] w-[400px] h-[400px] bg-orange-100/5 rounded-full blur-[100px] mix-blend-screen opacity-40 animate-pulse-slow will-change-transform" 
        style={{ transform: 'translateZ(0)' }}
      />
      
      {/* Nebula Effect (Right Bottom) */}
      <div 
        className="absolute bottom-[20%] right-[30%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow will-change-transform" 
        style={{ animationDelay: '1s', transform: 'translateZ(0)' }} 
      />

      {/* Purple Nebula - hidden on mobile for performance */}
      {!isTouchDevice && (
        <div 
          className="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] mix-blend-screen opacity-25 animate-pulse-slow will-change-transform" 
          style={{ animationDelay: '2s', transform: 'translateZ(0)' }} 
        />
      )}

      {/* Scattered Stars - reduced count on mobile */}
      <div className="absolute inset-0 opacity-80">
        {stars.map((star) => (
          <div 
            key={star.id}
            className="absolute rounded-full bg-foreground animate-twinkle will-change-opacity"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Shooting Star - hidden on mobile */}
      {!isTouchDevice && (
        <div className="absolute top-1/4 left-1/4 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-foreground to-transparent rotate-45 opacity-20 animate-shooting-star" />
      )}
    </div>
  );
};
