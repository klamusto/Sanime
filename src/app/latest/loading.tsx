import { RowSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="skeleton h-11 w-11 rounded-2xl" />
        <div className="space-y-2">
          <div className="skeleton h-6 w-40 rounded-full" />
          <div className="skeleton h-3 w-56 rounded-full" />
        </div>
      </div>
      <RowSkeleton count={9} />
    </div>
  );
}
