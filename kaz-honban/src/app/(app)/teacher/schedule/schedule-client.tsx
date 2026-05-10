"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  Clock,
  Lock,
  Unlock,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { SlotStatus } from "@/types/database";

const DAY_KEYS = ["day.sun", "day.mon", "day.tue", "day.wed", "day.thu", "day.fri", "day.sat"] as const;

interface TemplateItem {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  buffer_minutes: number;
}

interface SlotItem {
  id: string;
  start_at: string;
  end_at: string;
  status: SlotStatus;
}

interface ScheduleClientProps {
  templates: TemplateItem[];
  slots: SlotItem[];
}

interface SyncResponse {
  created: number;
  pruned: number;
  error?: string;
}

export function ScheduleClient({ templates: initialTemplates, slots: initialSlots }: ScheduleClientProps) {
  const router = useRouter();
  const { t } = useI18n();
  const [templates, setTemplates] = useState(initialTemplates);
  const [slots, setSlots] = useState(initialSlots);
  const [bufferMinutes, setBufferMinutes] = useState(5);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [newStartTime, setNewStartTime] = useState("09:00");
  const [newEndTime, setNewEndTime] = useState("17:00");
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<{ created: number; pruned: number } | null>(null);
  const teacherIdRef = useRef<string | null>(null);

  // Warn before unload while an add-template form is open with unsaved input
  useUnsavedChanges(addingDay !== null);

  // Refresh slot list from the DB. Used after sync and from realtime events.
  async function refreshSlots() {
    const supabase = createClient();
    const teacherId = teacherIdRef.current;
    if (!teacherId) return;
    const { data } = await supabase
      .from("availability_slots")
      .select("id, start_at, end_at, status")
      .eq("teacher_id", teacherId)
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(200);
    setSlots(((data ?? []) as unknown) as SlotItem[]);
  }

  // Call the server-side sync RPC. Generates 30-min slots that match the
  // cron's behavior, prunes orphan opens, and refreshes the local list.
  async function syncAvailability(): Promise<SyncResponse | null> {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/teacher/availability/sync", { method: "POST" });
      const data = (await res.json()) as SyncResponse;
      if (!res.ok) {
        setError(data.error ?? "Failed to sync availability");
        return null;
      }
      setLastSync({ created: data.created, pruned: data.pruned });
      await refreshSlots();
      return data;
    } catch {
      setError("Failed to sync availability");
      return null;
    } finally {
      setSyncing(false);
    }
  }

  // Resolve teacher id once and subscribe to realtime updates on the
  // teacher's own slot rows so block / unblock / dedupe / cron writes
  // reflect without a manual refresh.
  useEffect(() => {
    let mounted = true;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!mounted || !user) return;
      teacherIdRef.current = user.id;

      channel = supabase
        .channel(`schedule-slots-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "availability_slots",
            filter: `teacher_id=eq.${user.id}`,
          },
          () => {
            void refreshSlots();
          }
        )
        .subscribe();
    })();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function addTemplate(dayOfWeek: number) {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const userId = (await supabase.auth.getUser()).data.user!.id;

      const { data, error: insertError } = await supabase
        .from("schedule_templates")
        .insert({
          teacher_id: userId,
          day_of_week: dayOfWeek,
          start_time: newStartTime,
          end_time: newEndTime,
          buffer_minutes: bufferMinutes,
        } as never)
        .select()
        .single();

      if (insertError) {
        setError("Failed to add template");
        return;
      }

      const row = data as unknown as TemplateItem;
      setTemplates((prev) => [...prev, row]);
      setAddingDay(null);

      // Auto-sync so the new template immediately produces bookable
      // 30-min slots — teachers shouldn't have to remember a second click.
      await syncAvailability();
    } catch {
      setError("Failed to add template");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase
        .from("schedule_templates")
        .update({ is_active: false } as never)
        .eq("id", id);
      if (deleteError) {
        setError("Failed to delete template");
        return;
      }
      setTemplates((prev) => prev.filter((tmpl) => tmpl.id !== id));
      // Sync prunes any future open slots that no longer match an active template.
      await syncAvailability();
    } catch {
      setError("Failed to delete template");
    }
  }

  async function toggleSlotStatus(slotId: string, currentStatus: SlotStatus) {
    setTogglingSlot(slotId);
    try {
      const supabase = createClient();
      const newStatus = currentStatus === "blocked" ? "open" : "blocked";
      await supabase
        .from("availability_slots")
        .update({ status: newStatus } as never)
        .eq("id", slotId);
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: newStatus as SlotStatus } : s))
      );
    } finally {
      setTogglingSlot(null);
    }
  }

  // Group templates by day
  const templatesByDay: Record<number, TemplateItem[]> = {};
  for (let d = 0; d < 7; d++) {
    templatesByDay[d] = templates.filter((tmpl) => tmpl.day_of_week === d);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)]">
          {t("schedule.title")}
        </h1>
      </div>

      {/* Buffer setting */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">{t("schedule.buffer")}</span>
        <select
          value={bufferMinutes}
          onChange={(e) => setBufferMinutes(Number(e.target.value))}
          className="bg-white/5 rounded-lg border border-border px-3 py-1.5 text-sm text-text-primary focus:outline-none appearance-none"
        >
          {[0, 5, 10, 15, 30].map((m) => (
            <option key={m} value={m} className="bg-bg-secondary text-text-primary">
              {m} {t("schedule.min")}
            </option>
          ))}
        </select>
      </div>

      {/* Weekly Templates */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("schedule.weeklyTemplate")}
        </h2>
        {DAY_KEYS.map((dayKey, idx) => (
          <div key={dayKey} className="bg-bg-secondary rounded-2xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-text-primary text-sm">{t(dayKey)}</span>
              <button
                type="button"
                onClick={() => setAddingDay(addingDay === idx ? null : idx)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gold transition"
              >
                <Plus size={16} />
              </button>
            </div>

            {templatesByDay[idx].map((tmpl) => (
              <div key={tmpl.id} className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Clock size={14} />
                  {tmpl.start_time} - {tmpl.end_time}
                </div>
                <button
                  type="button"
                  onClick={() => deleteTemplate(tmpl.id)}
                  className="p-1 text-text-muted hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {templatesByDay[idx].length === 0 && addingDay !== idx && (
              <p className="text-xs text-text-muted pl-2">{t("schedule.noBlocks")}</p>
            )}

            {addingDay === idx && (
              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <input
                  type="time"
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="flex-1 bg-white/5 rounded-lg border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none"
                />
                <span className="text-text-muted text-xs">{t("schedule.to")}</span>
                <input
                  type="time"
                  value={newEndTime}
                  onChange={(e) => setNewEndTime(e.target.value)}
                  className="flex-1 bg-white/5 rounded-lg border border-border px-2 py-1.5 text-sm text-text-primary focus:outline-none"
                />
                <button
                  onClick={() => addTemplate(idx)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg bg-gold text-white text-sm font-medium hover:bg-gold/90 transition disabled:opacity-50"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : t("schedule.add")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sync Slots */}
      <div className="space-y-2">
        <button
          onClick={syncAvailability}
          disabled={syncing || templates.length === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
            "bg-gold text-white font-semibold text-sm",
            "hover:bg-gold/90 transition disabled:opacity-50"
          )}
        >
          {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
          {t("schedule.generate")}
        </button>
        <p className="text-xs text-text-muted text-center">{t("schedule.syncHint")}</p>
        {lastSync && !syncing && (
          <p className="text-xs text-emerald-400 text-center">
            {t("schedule.synced")} {t("schedule.syncedDetail")
              .replace("{created}", String(lastSync.created))
              .replace("{pruned}", String(lastSync.pruned))}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Upcoming Slots */}
      {slots.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            {t("schedule.upcoming")} ({slots.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {slots.map((slot) => {
              const start = new Date(slot.start_at);
              const isBlocked = slot.status === "blocked";
              const isBooked = slot.status === "booked";

              return (
                <div
                  key={slot.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border",
                    isBlocked
                      ? "bg-red-500/5 border-red-500/20"
                      : isBooked
                        ? "bg-blue-500/5 border-blue-500/20"
                        : "bg-white/5 border-border"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-text-muted" />
                    <div className="text-sm">
                      <span className="text-text-primary font-medium">
                        {start.toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-text-muted ml-2">
                        {start.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        slot.status === "open"
                          ? "text-green-400 bg-green-500/10"
                          : slot.status === "booked"
                            ? "text-blue-400 bg-blue-500/10"
                            : slot.status === "blocked"
                              ? "text-red-400 bg-red-500/10"
                              : "text-text-muted bg-white/5"
                      )}
                    >
                      {slot.status === "open"
                        ? t("schedule.open")
                        : slot.status === "booked"
                          ? t("schedule.booked")
                          : slot.status === "blocked"
                            ? t("schedule.blocked")
                            : t("schedule.held")}
                    </span>
                    {(slot.status === "open" || slot.status === "blocked") && (
                      <button
                        type="button"
                        disabled={togglingSlot === slot.id}
                        onClick={() => toggleSlotStatus(slot.id, slot.status)}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition text-text-muted"
                        title={isBlocked ? "Unblock" : "Block"}
                      >
                        {togglingSlot === slot.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : isBlocked ? (
                          <Unlock size={14} />
                        ) : (
                          <Lock size={14} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
