export default function TeacherDashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="rounded-2xl border border-border/50 p-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-white/5" />
            <div className="h-4 w-32 rounded bg-white/5" />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl border border-border/50 p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5" />
              <div className="space-y-2">
                <div className="h-5 w-16 rounded bg-white/5" />
                <div className="h-3 w-20 rounded bg-white/5" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-border/50 p-4 text-center">
            <div className="h-8 w-8 mx-auto rounded bg-white/5 mb-2" />
            <div className="h-3 w-16 mx-auto rounded bg-white/5" />
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border/50 p-6 space-y-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-white/5" />
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-white/5" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-32 rounded bg-white/5" />
            <div className="h-4 w-24 rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
