export default function BookingsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="h-7 w-32 rounded bg-white/5 animate-pulse" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/50 p-5 space-y-3 animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-32 rounded bg-white/5" />
              <div className="h-4 w-48 rounded bg-white/5" />
            </div>
          </div>
          <div className="h-10 rounded-xl bg-white/5" />
        </div>
      ))}
    </div>
  );
}
