// Reusable loading skeleton components
import { Skeleton } from '@/components/ui/skeleton';

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton = ({ count = 3 }: CardSkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-32 rounded-lg" />
    ))}
  </>
);

export const ConversationSkeleton = ({ count = 3 }: CardSkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass rounded-xl p-4 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-muted" />
          <div className="flex-1">
            <div className="h-5 bg-muted rounded w-1/3 mb-2" />
            <div className="h-4 bg-muted rounded w-2/3 mb-2" />
            <div className="h-3 bg-muted rounded w-1/4" />
          </div>
        </div>
      </div>
    ))}
  </>
);

export const SpaceSkeleton = ({ count = 3 }: CardSkeletonProps) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass rounded-xl p-5 animate-pulse">
        <div className="w-10 h-10 rounded-lg bg-muted mb-4" />
        <div className="h-5 bg-muted rounded w-2/3 mb-2" />
        <div className="h-4 bg-muted rounded w-1/3" />
      </div>
    ))}
  </>
);

export const GridSkeleton = ({ count = 3 }: CardSkeletonProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <CardSkeleton count={count} />
  </div>
);
