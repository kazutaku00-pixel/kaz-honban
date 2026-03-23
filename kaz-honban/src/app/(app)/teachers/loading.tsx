export default function TeachersLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="border-b border-border bg-bg-secondary/50 sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-5 py-4">
          <div className="h-6 w-20 rounded bg-white/5 animate-pulse" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-8 md:py-12">
        <div className="mb-8 space-y-2 animate-pulse">
          <div className="h-8 w-56 rounded bg-white/5" />
          <div className="h-4 w-80 rounded bg-white/5" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/50 p-5 space-y-4 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-white/5" />
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-28 rounded bg-white/5" />
                  <div className="h-3 w-40 rounded bg-white/5" />
                </div>
              </div>
              <div className="h-12 rounded bg-white/5" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-white/5" />
                <div className="h-6 w-16 rounded-full bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
