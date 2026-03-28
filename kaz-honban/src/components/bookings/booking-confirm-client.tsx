"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, TeacherProfile, AvailabilitySlot } from "@/types/database";

interface OverlappingBooking {
  id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  teacher: { display_name: string } | null;
}

interface BookingConfirmClientProps {
  teacher: Profile;
  teacherProfile: TeacherProfile;
  slot: AvailabilitySlot;
  durationMinutes: number;
  learnerId: string;
}

export function BookingConfirmClient({
  teacher,
  teacherProfile,
  slot,
  durationMinutes,
  learnerId,
}: BookingConfirmClientProps) {
  const router = useRouter();
  const [learnerNote, setLearnerNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Overlap detection state
  const [overlappingBooking, setOverlappingBooking] = useState<OverlappingBooking | null>(null);
  const [showOverlapModal, setShowOverlapModal] = useState(false);
  const [cancellingOverlap, setCancellingOverlap] = useState(false);

  const userTz = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  const startDate = new Date(slot.start_at);
  const endDate = new Date(
    startDate.getTime() + durationMinutes * 60 * 1000
  );

  const formattedDate = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: userTz,
  });

  const formattedStartTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: userTz,
  });

  const formattedEndTime = endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: userTz,
  });

  const tzShort = (() => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: userTz,
        timeZoneName: "short",
      }).formatToParts(new Date());
      return parts.find((p) => p.type === "timeZoneName")?.value ?? userTz;
    } catch { return userTz; }
  })();

  const isBeta = process.env.NEXT_PUBLIC_PAYMENT_ENABLED !== "true";

  // Check for overlapping bookings on mount
  useEffect(() => {
    async function checkOverlap() {
      const supabase = createClient();
      const { data } = await supabase
        .from("bookings")
        .select("id, scheduled_start_at, scheduled_end_at, duration_minutes, teacher:profiles!bookings_teacher_id_fkey(display_name)")
        .eq("learner_id", learnerId)
        .in("status", ["confirmed", "in_session"])
        .lt("scheduled_start_at", endDate.toISOString())
        .gt("scheduled_end_at", startDate.toISOString());

      if (data && data.length > 0) {
        const overlap = data[0] as unknown as OverlappingBooking;
        setOverlappingBooking(overlap);
        setShowOverlapModal(true);
      }
    }
    checkOverlap();
  }, [learnerId, startDate, endDate]);

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacher.id,
          slot_id: slot.id,
          duration_minutes: String(durationMinutes),
          learner_note: learnerNote || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create booking");
        return;
      }

      setIsConfirmed(true);
      setTimeout(() => {
        router.push("/bookings");
      }, 2000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancelOverlapAndBook() {
    if (!overlappingBooking) return;
    setCancellingOverlap(true);

    try {
      const res = await fetch(`/api/bookings/${overlappingBooking.id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancellation_reason: "Replaced with a new booking",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to cancel existing booking");
        setShowOverlapModal(false);
        return;
      }

      setOverlappingBooking(null);
      setShowOverlapModal(false);
      // Now proceed with the new booking
      await handleConfirm();
    } catch {
      setError("Failed to cancel existing booking");
      setShowOverlapModal(false);
    } finally {
      setCancellingOverlap(false);
    }
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Booking Confirmed!</h2>
          <p className="text-gray-400">Redirecting to your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Overlap Warning Modal */}
      {showOverlapModal && overlappingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 max-w-md w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Scheduling Conflict</h3>
                <p className="text-sm text-gray-400">
                  You already have a lesson at this time
                </p>
              </div>
            </div>

            {/* Existing booking info */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Existing Booking</p>
              <p className="text-sm text-white font-medium">
                {overlappingBooking.teacher?.display_name ?? "Teacher"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(overlappingBooking.scheduled_start_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: userTz,
                })}
                {" - "}
                {new Date(overlappingBooking.scheduled_end_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: userTz,
                })}
                {" "}({overlappingBooking.duration_minutes} min)
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowOverlapModal(false);
                  router.back();
                }}
                className="w-full py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition text-white"
              >
                Keep Existing Booking
              </button>
              <button
                onClick={handleCancelOverlapAndBook}
                disabled={cancellingOverlap}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium transition",
                  "bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-white",
                  "disabled:opacity-50 flex items-center justify-center gap-2"
                )}
              >
                {cancellingOverlap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  "Cancel Existing & Book This One"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Confirm Booking</h1>
        </div>

        {/* Teacher Card */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <div className="flex items-center gap-4">
            {teacher.avatar_url ? (
              <img
                src={teacher.avatar_url}
                alt={teacher.display_name}
                className="w-14 h-14 rounded-full object-cover border-2 border-[#FF6B4A]/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#FF6B4A]/20 flex items-center justify-center">
                <User className="w-7 h-7 text-[#FF6B4A]" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-lg">{teacher.display_name}</h2>
              {teacherProfile.headline && (
                <p className="text-sm text-gray-400">{teacherProfile.headline}</p>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Details */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-4">
          <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">
            Lesson Details
          </h3>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#FF6B4A]" />
              <span>{formattedDate}</span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#FF6B4A]" />
              <span>
                {formattedStartTime} - {formattedEndTime} ({durationMinutes} min)
                <span className="text-xs text-gray-500 ml-1">{tzShort}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#FF6B4A]" />
              {isBeta ? (
                <span className="text-green-400 font-medium">
                  Free during beta
                </span>
              ) : (
                <span>
                  $
                  {durationMinutes === 15
                    ? teacherProfile.hourly_rate / 4
                    : teacherProfile.hourly_rate / 2}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Learner Note */}
        <div className="rounded-xl bg-white/5 border border-white/10 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gray-400" />
            <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">
              Note to teacher (optional)
            </h3>
          </div>
          <textarea
            value={learnerNote}
            onChange={(e) => setLearnerNote(e.target.value)}
            placeholder="Tell the teacher what you'd like to focus on..."
            maxLength={500}
            rows={3}
            className={cn(
              "w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3",
              "text-white placeholder-gray-500 resize-none",
              "focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]/50 focus:border-[#FF6B4A]/50",
              "transition"
            )}
          />
          <p className="text-xs text-gray-500 text-right">
            {learnerNote.length}/500
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg transition",
            "bg-[#FF6B4A] hover:bg-[#FF6B4A]/90 text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirming...
            </>
          ) : (
            "Confirm Booking"
          )}
        </button>

        <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/15 p-4 space-y-1">
          <p className="text-xs text-yellow-300/80 font-medium">Cancellation Policy</p>
          <p className="text-xs text-gray-400">
            Free cancellation up to 2 hours before the lesson. After that, cancellation is not possible — please contact the teacher directly.
          </p>
        </div>
      </div>
    </div>
  );
}
