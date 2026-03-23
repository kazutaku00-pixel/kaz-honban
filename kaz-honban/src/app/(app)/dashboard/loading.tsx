export default function DashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome skeleton */}
      <div className="rounded-2xl border border-border/50 p-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="space-y-2">
            <div className="h-6 w-40 rounded bg-white/5" />
            <div className="h-4 w-28 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 p-4 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="space-y-2">
                <div className="h-6 w-8 rounded bg-white/5" />
                <div className="h-3 w-16 rounded bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Next lesson skeleton */}
      <div className="rounded-2xl border border-border/50 p-6 space-y-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-white/5" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/5" />
          <div className="space-y-2 flex-1">
            <div className="h-5 w-32 rounded bg-white/5" />
            <div className="h-4 w-48 rounded bg-white/5" />
          </div>
        </div>
      </div>

      {/* Recommendations skeleton */}
      <div className="space-y-3 animate-pulse">
        <div className="h-4 w-32 rounded bg-white/5" />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/50 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-white/5" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-28 rounded bg-white/5" />
              <div className="h-3 w-40 rounded bg-white/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
