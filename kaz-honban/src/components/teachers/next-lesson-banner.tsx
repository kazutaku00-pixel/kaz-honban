"use client";

import Link from "next/link";
import { Video, Clock, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocalTime } from "@/components/ui/local-time";
import type { Booking, Profile } from "@/types/database";

function isJoinable(startAt: string) {
  const diff = new Date(startAt).getTime() - Date.now();
  return diff <= 15 * 60 * 1000;
}

function formatCountdown(start: string) {
  const diff = new Date(start).getTime() - Date.now();
  if (diff <= 0) return "Starting now";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `in ${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

interface NextLessonBannerProps {
  booking: Booking & { teacher: Profile };
}

export function NextLessonBanner({ booking }: NextLessonBannerProps) {
  const joinable = isJoinable(booking.scheduled_start_at);

  return (
    <div
      className={cn(
        "mb-6 rounded-2xl border p-4 flex items-center gap-4 transition-colors",
        joinable
          ? "bg-accent/10 border-accent/30"
          : "bg-bg-secondary border-border"
      )}
    >
      {/* Teacher avatar */}
      {booking.teacher?.avatar_url ? (
        <img
          src={booking.teacher.avatar_url}
          alt={booking.teacher.display_name}
          className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
          {(booking.teacher?.display_name ?? "?")[0].toUpperCase()}
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate">
          Next: {booking.teacher?.display_name}
        </p>
        <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />
            <LocalTime isoString={booking.scheduled_start_at} format="date" />
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} />
            <LocalTime isoString={booking.scheduled_start_at} format="time" />
          </span>
          <span className="text-accent font-medium">
            {formatCountdown(booking.scheduled_start_at)}
          </span>
        </div>
      </div>

      {/* Action */}
      {joinable ? (
        <Link
          href={`/room/${booking.id}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition flex-shrink-0"
        >
          <Video size={16} />
          Join
        </Link>
      ) : (
        <Link
          href="/bookings"
          className="px-4 py-2 rounded-xl bg-white/5 text-text-secondary text-sm font-medium hover:bg-white/10 transition flex-shrink-0"
        >
          View
        </Link>
      )}
    </div>
  );
}
