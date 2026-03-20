"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  User,
  Video,
  X,
  Star,
  FileText,
  Loader2,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import type { BookingStatus } from "@/types/database";

interface BookingItem {
  id: string;
  learner_id: string;
  teacher_id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  status: BookingStatus;
  learner_note: string | null;
  teacher: { id: string; display_name: string; avatar_url: string | null } | null;
  learner: { id: string; display_name: string; avatar_url: string | null } | null;
  daily_room: { id: string; daily_room_url: string } | null;
  review: { id: string } | null;
  lesson_report: { id: string } | null;
}

interface BookingsListClientProps {
  bookings: BookingItem[];
  userId: string;
  fetchError: string | null;
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_session: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  no_show: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  in_session: "In Session",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

export function BookingsListClient({
  bookings,
  userId,
  fetchError,
}: BookingsListClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const now = new Date();

  const upcoming = bookings.filter(
    (b) =>
      (b.status === "confirmed" || b.status === "in_session") &&
      new Date(b.scheduled_end_at) >= now
  );

  const past = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.status === "no_show" ||
      (b.status !== "confirmed" &&
        b.status !== "in_session" &&
        new Date(b.scheduled_end_at) < now) ||
      ((b.status === "confirmed" || b.status === "in_session") &&
        new Date(b.scheduled_end_at) < now)
  );

  const displayedBookings = activeTab === "upcoming" ? upcoming : past;

  function isJoinable(booking: BookingItem) {
    if (booking.status !== "confirmed" && booking.status !== "in_session") return false;
    const start = new Date(booking.scheduled_start_at);
    const diff = start.getTime() - now.getTime();
    return diff <= 15 * 60 * 1000; // within 15 min of start
  }

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "PATCH",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setCancellingId(null);
    }
  }

  async function handleJoin(bookingId: string) {
    setJoiningId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.open(`${data.url}?t=${data.token}`, "_blank");
      }
    } finally {
      setJoiningId(null);
    }
  }

  function getOtherPerson(booking: BookingItem) {
    if (booking.learner_id === userId) {
      return booking.teacher;
    }
    return booking.learner;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">My Bookings</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {(["upcoming", "past"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium text-sm transition",
                activeTab === tab
                  ? "bg-[#FF6B4A] text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              {tab === "upcoming" ? "Upcoming" : "Past"}
              <span className="ml-1.5 text-xs opacity-70">
                ({tab === "upcoming" ? upcoming.length : past.length})
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {fetchError && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
            {fetchError}
          </div>
        )}

        {/* Bookings */}
        {displayedBookings.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400">
              {activeTab === "upcoming"
                ? "No upcoming bookings"
                : "No past bookings yet"}
            </p>
            {activeTab === "upcoming" && (
              <button
                onClick={() => router.push("/")}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#FF6B4A] text-white font-medium text-sm hover:bg-[#FF6B4A]/90 transition"
              >
                Find a teacher
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedBookings.map((booking) => {
              const other = getOtherPerson(booking);
              const start = new Date(booking.scheduled_start_at);
              const isTeacher = booking.teacher_id === userId;

              return (
                <div
                  key={booking.id}
                  className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3"
                >
                  {/* Top row: avatar + name + status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {other?.avatar_url ? (
                        <img
                          src={other.avatar_url}
                          alt={other.display_name}
                          className="w-10 h-10 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#FF6B4A]/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-[#FF6B4A]" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          {other?.display_name ?? "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isTeacher ? "Learner" : "Teacher"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full border",
                        STATUS_STYLES[booking.status]
                      )}
                    >
                      {STATUS_LABELS[booking.status]}
                    </span>
                  </div>

                  {/* Date/time row */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {start.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>
                        {start.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <span>{booking.duration_minutes} min</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 pt-1">
                    {activeTab === "upcoming" && (
                      <>
                        {isJoinable(booking) && (
                          <button
                            onClick={() => handleJoin(booking.id)}
                            disabled={joiningId === booking.id}
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                              "bg-[#FF6B4A] text-white font-medium text-sm",
                              "hover:bg-[#FF6B4A]/90 transition",
                              "disabled:opacity-50"
                            )}
                          >
                            {joiningId === booking.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Video className="w-4 h-4" />
                            )}
                            Join Room
                          </button>
                        )}
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className={cn(
                            "flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl",
                            "bg-white/5 text-gray-400 font-medium text-sm",
                            "hover:bg-red-500/10 hover:text-red-400 transition",
                            "disabled:opacity-50"
                          )}
                        >
                          {cancellingId === booking.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Cancel
                        </button>
                      </>
                    )}

                    {activeTab === "past" && booking.status === "completed" && (
                      <>
                        {!booking.review && !isTeacher && (
                          <button
                            onClick={() =>
                              router.push(`/bookings/${booking.id}/review`)
                            }
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                              "bg-[#FF6B4A]/10 text-[#FF6B4A] font-medium text-sm",
                              "hover:bg-[#FF6B4A]/20 transition"
                            )}
                          >
                            <Star className="w-4 h-4" />
                            Write Review
                          </button>
                        )}
                        {booking.lesson_report && (
                          <button
                            onClick={() =>
                              router.push(
                                `/bookings/${booking.id}/report`
                              )
                            }
                            className={cn(
                              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                              "bg-white/5 text-gray-300 font-medium text-sm",
                              "hover:bg-white/10 transition"
                            )}
                          >
                            <FileText className="w-4 h-4" />
                            View Report
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
