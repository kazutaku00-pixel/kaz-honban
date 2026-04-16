"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherRow {
  user_id: string;
  display_name: string;
  profile_active: boolean;
  approval_status: string;
  is_public: boolean;
  templates_total: number;
  templates_active: number;
  slots_total: number;
  slots_open_future: number;
  can_generate: boolean;
}

interface Summary {
  teachers_total: number;
  teachers_approved: number;
  teachers_ready_for_generation: number;
  teachers_with_no_future_slots: number;
  templates_total: number;
  templates_active: number;
  slots_total: number;
  slots_open_future: number;
}

export function SlotDiagnosticsPanel() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots/diagnose");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load diagnostics");
        return;
      }
      setSummary(json.summary);
      setTeachers(json.teachers);
    } catch {
      setError("Failed to load diagnostics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function generate() {
    if (running) return;
    setRunning(true);
    setLastResult(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/slots/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days_ahead: 14 }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to generate");
        return;
      }
      setLastResult(`Generated ${json.created_count} slot(s) for next 14 days.`);
      await load();
    } catch {
      setError("Failed to generate slots");
    } finally {
      setRunning(false);
    }
  }

  const needsAttention = teachers.filter((t) => !t.can_generate || t.slots_open_future === 0);
  const visible = showAll ? teachers : needsAttention;

  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Slot Diagnostics</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Why learners may see &quot;no available slots&quot;
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-text-secondary text-xs font-medium hover:bg-white/10 transition disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Refresh
          </button>
          <button
            onClick={generate}
            disabled={running}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition disabled:opacity-50"
          >
            {running ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            Generate slots (14 days)
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {lastResult && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 size={14} />
          {lastResult}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Approved teachers" value={summary.teachers_approved} total={summary.teachers_total} />
          <Stat label="Ready to generate" value={summary.teachers_ready_for_generation} />
          <Stat label="Active templates" value={summary.templates_active} total={summary.templates_total} />
          <Stat label="Future open slots" value={summary.slots_open_future} total={summary.slots_total} warn={summary.slots_open_future === 0} />
        </div>
      )}

      {teachers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {needsAttention.length} teacher(s) need attention
              {needsAttention.length === 0 && " 🎉"}
            </p>
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs text-accent hover:underline"
            >
              {showAll ? "Show only issues" : "Show all"}
            </button>
          </div>
          <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {visible.map((t) => (
              <div key={t.user_id} className="p-3 flex items-center gap-3 bg-bg-tertiary/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {t.display_name}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px]">
                    <Pill ok={t.profile_active} label={`profile:${t.profile_active ? "active" : "inactive"}`} />
                    <Pill ok={t.approval_status === "approved"} label={`status:${t.approval_status}`} />
                    <Pill ok={t.templates_active > 0} label={`templates:${t.templates_active}/${t.templates_total}`} />
                    <Pill ok={t.slots_open_future > 0} label={`future slots:${t.slots_open_future}`} />
                  </div>
                </div>
              </div>
            ))}
            {visible.length === 0 && (
              <div className="p-4 text-center text-xs text-text-muted">
                All approved teachers have future slots.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  total,
  warn,
}: {
  label: string;
  value: number;
  total?: number;
  warn?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        warn
          ? "border-amber-500/40 bg-amber-500/10"
          : "border-border bg-bg-tertiary/50"
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={cn("text-xl font-bold mt-0.5", warn ? "text-amber-400" : "text-text-primary")}>
        {value}
        {total !== undefined && (
          <span className="text-sm text-text-muted font-normal"> / {total}</span>
        )}
      </p>
    </div>
  );
}

function Pill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "px-1.5 py-0.5 rounded font-medium",
        ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
      )}
    >
      {label}
    </span>
  );
}
