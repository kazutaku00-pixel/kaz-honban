"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ClipboardList,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryBooking {
  id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  scheduled_start_at: string;
  duration_minutes: number;
  lesson_report: {
    summary: string | null;
    homework: string | null;
  } | null;
}

export function HistoryClient({ bookings }: { bookings: HistoryBooking[] }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(null);

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
          Lesson History
        </h1>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted">No completed lessons yet</p>
          <button
            onClick={() => router.push("/teachers")}
            className="mt-2 px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition"
          >
            Find a teacher
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isExpanded = expanded === booking.id;
            const start = new Date(booking.scheduled_start_at);
            const hasHomework = !!booking.lesson_report?.homework;

            return (
              <div
                key={booking.id}
                className="bg-bg-secondary rounded-2xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : booking.id)}
                  className="w-full p-4 flex items-center gap-3 text-left"
                >
                  {booking.teacher_avatar ? (
                    <img
                      src={booking.teacher_avatar}
                      alt={booking.teacher_name}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text-primary text-sm truncate">
                        {booking.teacher_name}
                      </p>
                      {hasHomework && (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-gold/20 text-gold rounded-full">
                          Homework
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {start.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {booking.duration_minutes} min
                      </span>
                    </div>
                  </div>
                  {booking.lesson_report ? (
                    isExpanded ? (
                      <ChevronUp size={18} className="text-text-muted" />
                    ) : (
                      <ChevronDown size={18} className="text-text-muted" />
                    )
                  ) : null}
                </button>

                {isExpanded && booking.lesson_report && (
                  <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                    {booking.lesson_report.summary && (
                      <div>
                        <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">
                          Summary
                        </p>
                        <p className="text-sm text-text-secondary">
                          {booking.lesson_report.summary}
                        </p>
                      </div>
                    )}
                    {booking.lesson_report.homework && (
                      <div>
                        <p className="text-xs font-medium text-gold uppercase tracking-wider mb-1 flex items-center gap-1">
                          <ClipboardList size={12} />
                          Homework
                        </p>
                        <p className="text-sm text-text-secondary">
                          {booking.lesson_report.homework}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
