import { useMemo } from 'react';

export const BackgroundEffects = () => {
  // Generate stars once on mount
  const stars = useMemo(() => {
    return [...Array(60)].map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() > 0.9 ? '3px' : Math.random() > 0.7 ? '2px' : '1px',
      opacity: 0.3 + Math.random() * 0.7,
      delay: `${Math.random() * 5}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Deep Space Background Base */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Radial Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.08),hsl(var(--background)))]" />

      {/* Sun Effect (Left Top) */}
      <div className="absolute top-[20%] left-[25%] w-[400px] h-[400px] bg-orange-100/5 rounded-full blur-[100px] mix-blend-screen opacity-40 animate-pulse-slow" />
      
      {/* Nebula Effect (Right Bottom) */}
      <div className="absolute bottom-[20%] right-[30%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] mix-blend-screen opacity-30 animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Purple Nebula */}
      <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] mix-blend-screen opacity-25 animate-pulse-slow" style={{ animationDelay: '2s' }} />

      {/* Scattered Stars */}
      <div className="absolute inset-0 opacity-80">
        {stars.map((star) => (
          <div 
            key={star.id}
            className="absolute rounded-full bg-foreground animate-twinkle"
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

      {/* Shooting Star */}
      <div className="absolute top-1/4 left-1/4 w-[200px] h-[1px] bg-gradient-to-r from-transparent via-foreground to-transparent rotate-45 opacity-20 animate-shooting-star" />
    </div>
  );
};
