export const SkeletonCard = () => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="h-4 w-14 rounded-full skeleton-shimmer" />
        <div className="h-6 w-6 rounded-full skeleton-shimmer" />
      </div>
      <div className="flex flex-col items-center py-4 gap-3">
        <div className="h-10 w-4/5 rounded-lg skeleton-shimmer" />
        <div className="h-5 w-16 rounded-full skeleton-shimmer" />
        <div className="h-4 w-24 rounded skeleton-shimmer" />
        <div className="h-3 w-3/4 rounded skeleton-shimmer" />
        <div className="h-3 w-1/2 rounded skeleton-shimmer" />
      </div>
      <div className="flex gap-2 mt-4 pt-3 border-t border-border/50">
        <div className="flex-1 h-8 rounded-lg skeleton-shimmer" />
        <div className="flex-1 h-8 rounded-lg skeleton-shimmer" />
      </div>
    </div>
  </div>
);

export const SkeletonCardGrid = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonListRow = () => (
  <div className="flex items-center gap-4 p-4 border-b border-border last:border-0">
    <div className="h-5 w-32 rounded skeleton-shimmer shrink-0" />
    <div className="h-4 w-20 rounded skeleton-shimmer" />
    <div className="ml-auto h-4 w-16 rounded skeleton-shimmer" />
  </div>
);

export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="rounded-xl border border-border overflow-hidden">
    <div className="flex gap-4 p-4 bg-muted/30 border-b border-border">
      <div className="h-4 w-40 rounded skeleton-shimmer" />
      <div className="h-4 w-20 rounded skeleton-shimmer" />
      <div className="h-4 w-20 rounded skeleton-shimmer" />
      <div className="ml-auto h-4 w-20 rounded skeleton-shimmer" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonListRow key={i} />
    ))}
  </div>
);
