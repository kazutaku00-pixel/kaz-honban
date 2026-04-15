"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AvailabilitySlot } from "@/types/database";

interface AvailableSlotsProps {
  teacherId: string;
  teacherTimezone?: string | null;
}

const SLOT_RANGE_DAYS = 14;
const VISIBLE_DAYS = 5;
const SLOTS_PER_DAY_COLLAPSED = 4;
const MIN_LEAD_MINUTES = 60;

function getNextDays(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < SLOT_RANGE_DAYS; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function formatDayLabel(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDayName(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function formatTime(isoString: string, tz: string) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: tz,
  });
}

function formatTimezoneShort(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? tz;
  } catch {
    return tz;
  }
}

export function AvailableSlots({ teacherId, teacherTimezone }: AvailableSlotsProps) {
  const router = useRouter();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOffset, setDayOffset] = useState(0);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const userTz = useMemo(() => getUserTimezone(), []);
  const showDualTimezone = !!teacherTimezone && teacherTimezone !== userTz;

  const allDays = useMemo(() => getNextDays(), []);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      const supabase = createClient();

      const startOfRange = allDays[0].toISOString();
      const endOfRange = new Date(allDays[allDays.length - 1]);
      endOfRange.setDate(endOfRange.getDate() + 1);

      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("status", "open")
        .gte("start_at", startOfRange)
        .lt("start_at", endOfRange.toISOString())
        .order("start_at", { ascending: true });

      const raw = (data ?? []) as unknown as AvailabilitySlot[];

      // Always book a full 30-min lesson: if a slot is shorter than 30 min
      // (legacy 15-min slots), it must chain with the next open slot.
      const openStartTimes = new Set(raw.map((s) => s.start_at));
      const lessonEndsAt = (s: AvailabilitySlot) =>
        new Date(new Date(s.start_at).getTime() + 30 * 60 * 1000).toISOString();

      const leadCutoff = Date.now() + MIN_LEAD_MINUTES * 60 * 1000;

      const bookable = raw.filter((s) => {
        if (new Date(s.start_at).getTime() < leadCutoff) return false;
        // Slot already covers 30 min on its own
        if (new Date(s.end_at).getTime() >= new Date(lessonEndsAt(s)).getTime()) return true;
        // Otherwise require a consecutive open slot
        return openStartTimes.has(s.end_at);
      });

      setSlots(bookable);
      setLoading(false);
    }
    fetchSlots();
  }, [teacherId, allDays]);

  // Visible days window
  const visibleDays = allDays.slice(dayOffset, dayOffset + VISIBLE_DAYS);

  // Group slots by day
  const slotsByDay = useMemo(() => {
    const map = new Map<number, AvailabilitySlot[]>();
    for (const day of allDays) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      map.set(
        day.getTime(),
        slots.filter((s) => {
          const start = new Date(s.start_at);
          return start >= dayStart && start < dayEnd;
        })
      );
    }
    return map;
  }, [slots, allDays]);

  const handleSlotClick = (slot: AvailabilitySlot) => {
    router.push(
      `/booking/confirm?teacher_id=${teacherId}&slot_id=${slot.id}`
    );
  };

  const toggleExpand = (dayKey: number) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayKey)) {
        next.delete(dayKey);
      } else {
        next.add(dayKey);
      }
      return next;
    });
  };

  const canGoBack = dayOffset > 0;
  const canGoForward = dayOffset + VISIBLE_DAYS < SLOT_RANGE_DAYS;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)]">
          Available Slots
        </h3>
        <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-lg">
          {formatTimezoneShort(userTz)}
        </span>
      </div>

      {/* Duration is fixed at 30 min */}
      <p className="text-xs text-text-muted mb-5">All lessons are 30 minutes.</p>

      {/* Cambly-style multi-column day view */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {Array.from({ length: VISIBLE_DAYS }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-12 rounded-lg bg-bg-tertiary animate-pulse" />
              <div className="h-9 rounded-lg bg-bg-tertiary animate-pulse" />
              <div className="h-9 rounded-lg bg-bg-tertiary animate-pulse" />
            </div>
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-text-muted text-sm">
            This teacher has no available slots in the next {SLOT_RANGE_DAYS} days.
          </p>
          <p className="text-text-muted text-xs">
            Check back later or browse other teachers.
          </p>
        </div>
      ) : (
        <div>
          {/* Day navigation */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setDayOffset((o) => Math.max(0, o - VISIBLE_DAYS))}
              disabled={!canGoBack}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() =>
                setDayOffset((o) =>
                  Math.min(SLOT_RANGE_DAYS - VISIBLE_DAYS, o + VISIBLE_DAYS)
                )
              }
              disabled={!canGoForward}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Column grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
            {visibleDays.map((day) => {
              const dayKey = day.getTime();
              const daySlots = slotsByDay.get(dayKey) ?? [];
              const isExpanded = expandedDays.has(dayKey);
              const visibleSlots = isExpanded
                ? daySlots
                : daySlots.slice(0, SLOTS_PER_DAY_COLLAPSED);
              const hiddenCount = daySlots.length - SLOTS_PER_DAY_COLLAPSED;

              return (
                <div key={dayKey} className="min-w-0">
                  {/* Day header */}
                  <div className="text-center mb-2 pb-2 border-b border-border">
                    <p className="text-xs font-bold text-text-primary">
                      {formatDayName(day)}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {formatDayLabel(day)}
                    </p>
                  </div>

                  {/* Slots */}
                  <div className="space-y-1.5">
                    {daySlots.length === 0 ? (
                      <p className="text-center text-text-muted text-xs py-3">
                        - -
                      </p>
                    ) : (
                      <>
                        {visibleSlots.map((slot) => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleSlotClick(slot)}
                            title={
                              showDualTimezone
                                ? `Teacher's time: ${formatTime(slot.start_at, teacherTimezone!)} ${formatTimezoneShort(teacherTimezone!)}`
                                : undefined
                            }
                            className={cn(
                              "w-full py-2 px-1 rounded-lg text-xs font-medium transition-all",
                              "bg-bg-tertiary text-text-secondary border border-border",
                              "hover:border-accent/50 hover:text-accent hover:bg-accent-subtle",
                              showDualTimezone && "leading-tight"
                            )}
                          >
                            <div>{formatTime(slot.start_at, userTz)}</div>
                            {showDualTimezone && (
                              <div className="text-[9px] text-text-muted font-normal mt-0.5">
                                {formatTime(slot.start_at, teacherTimezone!)} {formatTimezoneShort(teacherTimezone!)}
                              </div>
                            )}
                          </button>
                        ))}
                        {!isExpanded && hiddenCount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(dayKey)}
                            className="w-full py-1.5 text-[10px] font-medium text-accent hover:underline"
                          >
                            +{hiddenCount} MORE
                          </button>
                        )}
                        {isExpanded && hiddenCount > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleExpand(dayKey)}
                            className="w-full py-1.5 text-[10px] font-medium text-text-muted hover:text-text-secondary"
                          >
                            Show less
                          </button>
                        )}
                      </>
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
