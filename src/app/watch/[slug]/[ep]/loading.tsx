export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="skeleton h-6 w-52 rounded-full" />
            <div className="skeleton h-9 w-40 rounded-full" />
          </div>
          <div className="skeleton aspect-video w-full rounded-3xl" />
          <div className="mt-5 flex gap-2">
            <div className="skeleton h-9 w-32 rounded-full" />
            <div className="skeleton h-9 w-28 rounded-full" />
            <div className="skeleton h-9 w-24 rounded-full" />
          </div>
          <div className="skeleton mt-6 h-36 w-full rounded-3xl" />
        </div>
        <div className="skeleton h-[28rem] w-full rounded-3xl" />
      </div>
    </div>
  );
}
