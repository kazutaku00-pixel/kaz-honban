"use client";

import { useState } from "react";
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
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
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
  const [generating, setGenerating] = useState(false);
  const [togglingSlot, setTogglingSlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setTemplates([...templates, row]);
      setAddingDay(null);
    } catch {
      setError("Failed to add template");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTemplate(id: string) {
    const supabase = createClient();
    await supabase.from("schedule_templates").update({ is_active: false } as never).eq("id", id);
    setTemplates(templates.filter((t) => t.id !== id));
  }

  async function generateSlots() {
    setGenerating(true);
    setError(null);
    try {
      const supabase = createClient();
      const userId = (await supabase.auth.getUser()).data.user!.id;

      // Generate slots for next 7 days based on templates
      const newSlots: { teacher_id: string; start_at: string; end_at: string }[] = [];

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const date = new Date();
        date.setDate(date.getDate() + dayOffset);
        const dayOfWeek = date.getDay();

        const dayTemplates = templates.filter((t) => t.day_of_week === dayOfWeek);

        for (const template of dayTemplates) {
          const [startH, startM] = template.start_time.split(":").map(Number);
          const [endH, endM] = template.end_time.split(":").map(Number);

          let currentMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          const slotDuration = 25;
          const buffer = template.buffer_minutes;

          while (currentMinutes + slotDuration <= endMinutes) {
            const slotStart = new Date(date);
            slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);

            // Only create future slots
            if (slotStart.getTime() > Date.now()) {
              newSlots.push({
                teacher_id: userId,
                start_at: slotStart.toISOString(),
                end_at: slotEnd.toISOString(),
              });
            }

            currentMinutes += slotDuration + buffer;
          }
        }
      }

      if (newSlots.length === 0) {
        setError("No new slots to generate. Check that you have templates for upcoming days and that the times haven't passed yet.");
        return;
      }

      // De-duplicate: check existing slots for this teacher in the date range
      const rangeStart = newSlots[0].start_at;
      const rangeEnd = newSlots[newSlots.length - 1].end_at;
      const { data: existingSlots } = await supabase
        .from("availability_slots")
        .select("start_at")
        .eq("teacher_id", userId)
        .gte("start_at", rangeStart)
        .lte("start_at", rangeEnd);

      const existingSet = new Set(
        (existingSlots ?? []).map((s: { start_at: string }) => s.start_at)
      );
      const uniqueSlots = newSlots.filter((s) => !existingSet.has(s.start_at));

      if (uniqueSlots.length === 0) {
        setError("All slots already exist for the next 7 days.");
        return;
      }

      const { error: insertError } = await supabase
        .from("availability_slots")
        .insert(uniqueSlots as never[]);

      if (insertError) {
        setError("Failed to generate slots");
      }

      router.refresh();
    } catch {
      setError("Failed to generate slots");
    } finally {
      setGenerating(false);
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
      setSlots(slots.map((s) => (s.id === slotId ? { ...s, status: newStatus as SlotStatus } : s)));
    } finally {
      setTogglingSlot(null);
    }
  }

  // Group templates by day
  const templatesByDay: Record<number, TemplateItem[]> = {};
  for (let d = 0; d < 7; d++) {
    templatesByDay[d] = templates.filter((t) => t.day_of_week === d);
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

      {/* Generate Slots */}
      <button
        onClick={generateSlots}
        disabled={generating || templates.length === 0}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 rounded-xl",
          "bg-gold text-white font-semibold text-sm",
          "hover:bg-gold/90 transition disabled:opacity-50"
        )}
      >
        {generating ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Zap size={18} />
        )}
        {t("schedule.generate")}
      </button>

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
                      {slot.status === "open" ? t("schedule.open") : slot.status === "booked" ? t("schedule.booked") : slot.status === "blocked" ? t("schedule.blocked") : t("schedule.held")}
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
