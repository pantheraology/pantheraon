import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface RateLimitCountdownProps {
  retryAt: Date;
  onExpired: () => void;
}

export const RateLimitCountdown = ({ retryAt, onExpired }: RateLimitCountdownProps) => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    const calculateRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((retryAt.getTime() - now) / 1000));
      return remaining;
    };

    setSecondsRemaining(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [retryAt, onExpired]);

  if (secondsRemaining <= 0) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = minutes > 0 
    ? `${minutes}:${seconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <div className="flex items-center justify-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
      <Clock size={16} className="animate-pulse" />
      <span>Rate limited. Try again in <strong>{timeDisplay}</strong></span>
    </div>
  );
};
