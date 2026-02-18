export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-secondary" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-secondary rounded w-3/4" />
          <div className="h-3 bg-secondary rounded w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-5 neu-flat animate-pulse">
      <div className="h-8 bg-secondary rounded w-16 mb-2" />
      <div className="h-3 bg-secondary rounded w-24" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 neu-flat animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-secondary" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-secondary rounded w-1/3" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-9 rounded-xl bg-secondary" />
        <div className="h-9 w-9 rounded-xl bg-secondary" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
