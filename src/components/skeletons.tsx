export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-edge bg-card">
      <div className="skeleton aspect-[3/4] w-full" />
      <div className="space-y-2 p-3">
        <div className="skeleton h-3.5 w-4/5 rounded" />
        <div className="skeleton h-3 w-2/5 rounded" />
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-edge bg-surface">
      <div className="grid min-h-[430px] items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14">
        <div className="max-w-2xl space-y-4">
          <div className="skeleton h-7 w-40 rounded-full" />
          <div className="skeleton h-10 w-3/4 rounded-xl" />
          <div className="skeleton h-4 w-1/3 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
          <div className="flex gap-3 pt-3">
            <div className="skeleton h-12 w-36 rounded-xl" />
            <div className="skeleton h-12 w-32 rounded-xl" />
          </div>
        </div>
        <div className="skeleton hidden h-80 w-56 rounded-2xl lg:block" />
      </div>
    </div>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-2xl border border-edge bg-card p-3">
          <div className="skeleton h-24 w-20 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2 py-1">
            <div className="skeleton h-3.5 w-4/5 rounded" />
            <div className="skeleton h-3 w-3/5 rounded" />
            <div className="skeleton h-3 w-2/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
