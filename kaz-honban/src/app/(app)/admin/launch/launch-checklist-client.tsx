"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "ok" | "warn" | "fail";

interface Check {
  key: string;
  label: string;
  status: Status;
  detail: string;
  critical: boolean;
}

interface Summary {
  ok: number;
  warn: number;
  fail: number;
  blocking: number;
  total: number;
}

const STATUS_META: Record<Status, { icon: React.ElementType; color: string; label: string }> = {
  ok: { icon: CheckCircle2, color: "text-emerald-400", label: "OK" },
  warn: { icon: AlertTriangle, color: "text-amber-400", label: "Warn" },
  fail: { icon: XCircle, color: "text-red-400", label: "Fail" },
};

export function LaunchChecklistClient() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/launch-check");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load checks");
        return;
      }
      setSummary(json.summary);
      setChecks(json.checks);
    } catch {
      setError("Failed to load checks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const readyForPilot = summary ? summary.blocking === 0 : false;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-text-secondary text-xs font-medium hover:bg-white/10 transition disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
        {summary && (
          <span className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-semibold",
            readyForPilot ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
          )}>
            {readyForPilot ? "Ready for pilot" : `${summary.blocking} blocking issue(s)`}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-3 gap-3">
          {(["ok", "warn", "fail"] as Status[]).map((s) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            const count = summary[s];
            return (
              <div key={s} className="bg-bg-secondary rounded-xl border border-border p-4 text-center">
                <Icon size={20} className={cn("mx-auto mb-1", meta.color)} />
                <p className="text-2xl font-bold text-text-primary">{count}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider mt-0.5">{meta.label}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-2">
        {checks.map((c) => {
          const meta = STATUS_META[c.status];
          const Icon = meta.icon;
          return (
            <div
              key={c.key}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                c.status === "ok" && "bg-bg-secondary border-border",
                c.status === "warn" && "bg-amber-500/5 border-amber-500/30",
                c.status === "fail" && "bg-red-500/5 border-red-500/30"
              )}
            >
              <Icon size={18} className={cn("shrink-0 mt-0.5", meta.color)} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{c.label}</p>
                <p className="text-xs text-text-muted mt-0.5">{c.detail}</p>
              </div>
              {c.critical && (
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-text-muted shrink-0">
                  Critical
                </span>
              )}
            </div>
          );
        })}
        {checks.length === 0 && !loading && !error && (
          <p className="text-center text-text-muted py-8">No checks loaded.</p>
        )}
      </div>
    </div>
  );
}
