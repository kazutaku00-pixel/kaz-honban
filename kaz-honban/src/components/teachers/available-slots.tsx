"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import type { AvailabilitySlot } from "@/types/database";

interface AvailableSlotsProps {
  teacherId: string;
}

function getNext7Days(): Date[] {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }
  return days;
}

function formatDay(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  if (date.getTime() === today.getTime()) return "Today";
  if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

export function AvailableSlots({ teacherId }: AvailableSlotsProps) {
  const router = useRouter();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [duration, setDuration] = useState<25 | 50>(25);
  const userTz = useMemo(() => getUserTimezone(), []);

  const days = useMemo(() => getNext7Days(), []);

  useEffect(() => {
    async function fetchSlots() {
      setLoading(true);
      const supabase = createClient();

      const startOfRange = days[0].toISOString();
      const endOfRange = new Date(days[6]);
      endOfRange.setDate(endOfRange.getDate() + 1);

      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("status", "open")
        .gte("start_at", startOfRange)
        .lt("start_at", endOfRange.toISOString())
        .order("start_at", { ascending: true });

      setSlots(data ?? []);
      setLoading(false);
    }
    fetchSlots();
  }, [teacherId, days]);

  const selectedDate = days[selectedDateIndex];

  const slotsForDate = useMemo(() => {
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);

    return slots.filter((s) => {
      const start = new Date(s.start_at);
      return start >= dayStart && start < dayEnd;
    });
  }, [slots, selectedDate]);

  const handleSlotClick = (slot: AvailabilitySlot) => {
    router.push(
      `/booking/confirm?teacher_id=${teacherId}&slot_id=${slot.id}&duration=${duration}`
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary font-[family-name:var(--font-display)]">
          Available Slots
        </h3>
        <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded-lg">
          {formatTimezoneShort(userTz)}
        </span>
      </div>

      {/* Duration toggle */}
      <div className="flex gap-2 mb-5">
        {([25, 50] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDuration(d)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-colors",
              duration === d
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary border border-border hover:border-border-hover"
            )}
          >
            <Clock size={14} className="inline mr-1.5 -mt-0.5" />
            {d} min
          </button>
        ))}
      </div>

      {/* Date picker (horizontal scroll) */}
      <div className="flex items-center gap-1 mb-5">
        <button
          type="button"
          onClick={() => setSelectedDateIndex((i) => Math.max(0, i - 1))}
          disabled={selectedDateIndex === 0}
          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>

        <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1 px-1">
          {days.map((day, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedDateIndex(i)}
              className={cn(
                "flex flex-col items-center min-w-[64px] py-2 px-3 rounded-xl text-xs transition-colors",
                selectedDateIndex === i
                  ? "bg-accent text-white"
                  : "bg-bg-tertiary text-text-secondary border border-border hover:border-border-hover"
              )}
            >
              <span className="font-medium">{formatDay(day)}</span>
              <span className="text-[10px] mt-0.5 opacity-70">
                {formatDate(day)}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setSelectedDateIndex((i) => Math.min(6, i + 1))}
          disabled={selectedDateIndex === 6}
          className="p-1 text-text-muted hover:text-text-primary disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Time slots */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-10 rounded-xl bg-bg-tertiary animate-pulse"
            />
          ))}
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-text-muted text-sm">
            This teacher has no available slots in the next 7 days.
          </p>
          <p className="text-text-muted text-xs">
            Check back later or browse other teachers.
          </p>
        </div>
      ) : slotsForDate.length === 0 ? (
        <p className="text-center py-8 text-text-muted text-sm">
          No slots on this day — try another date above
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {slotsForDate.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => handleSlotClick(slot)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                "bg-bg-tertiary text-text-secondary border border-border",
                "hover:border-accent/50 hover:text-accent hover:bg-accent-subtle"
              )}
            >
              {formatTime(slot.start_at, userTz)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
