import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Reusable skeleton grid mirroring HeroStyleCard's aspect and layout so first
 * paint matches the final grid without jump.
 */
export const DomainGridSkeleton = ({
  count = 8,
  className,
  view = 'grid',
}: { count?: number; className?: string; view?: 'grid' | 'list' }) => {
  if (view === 'list') {
    return (
      <div className={cn('space-y-2', className)} data-testid="skeleton-domain-list">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-card/40"
          >
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1.5">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div
      className={cn(
        'grid gap-3 sm:gap-4',
        'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
        className,
      )}
      data-testid="skeleton-domain-grid"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-gradient-to-br from-muted/40 to-muted/10 aspect-[4/3] p-5 flex flex-col justify-between overflow-hidden relative"
        >
          <div className="absolute inset-0 shimmer-overlay" aria-hidden />
          <Skeleton className="h-4 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-end justify-between">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
};
