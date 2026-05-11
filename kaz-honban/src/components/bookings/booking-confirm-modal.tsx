"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  Loader2,
  X,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LESSON_DURATION_MINUTES } from "@/lib/validations";
import {
  LESSON_PACE_OPTIONS,
  CORRECTION_STYLES,
  FOCUS_AREAS,
  encodePreferences,
  type LessonPace,
  type CorrectionStyle,
  type FocusArea,
} from "@/lib/lesson-preferences";
import type { AvailabilitySlot } from "@/types/database";

interface OverlappingBooking {
  id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  teacher: { display_name: string } | null;
}

interface BookingConfirmModalProps {
  open: boolean;
  onClose: () => void;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string | null;
  teacherHeadline: string | null;
  hourlyRate: number;
  slot: AvailabilitySlot;
  onBooked?: () => void;
}

export function BookingConfirmModal({
  open,
  onClose,
  teacherId,
  teacherName,
  teacherAvatar,
  teacherHeadline,
  hourlyRate,
  slot,
  onBooked,
}: BookingConfirmModalProps) {
  const durationMinutes = LESSON_DURATION_MINUTES;
  const router = useRouter();
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [learnerNote, setLearnerNote] = useState("");
  const [pace, setPace] = useState<LessonPace | "">("");
  const [correction, setCorrection] = useState<CorrectionStyle | "">("");
  const [focus, setFocus] = useState<FocusArea[]>([]);
  const [encouragement, setEncouragement] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [overlappingBooking, setOverlappingBooking] = useState<OverlappingBooking | null>(null);
  const [cancellingOverlap, setCancellingOverlap] = useState(false);

  const userTz = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  const startDate = useMemo(() => new Date(slot.start_at), [slot.start_at]);
  const endDate = useMemo(
    () => new Date(startDate.getTime() + durationMinutes * 60 * 1000),
    [startDate, durationMinutes]
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

  // Reset state whenever modal reopens for a different slot
  useEffect(() => {
    if (!open) return;
    setLearnerNote("");
    setPace("");
    setCorrection("");
    setFocus([]);
    setEncouragement(false);
    setError(null);
    setIsConfirmed(false);
    setOverlappingBooking(null);
  }, [open, slot.id]);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key closes the modal
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fetch learner + detect overlapping booking on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      if (cancelled) return;
      setLearnerId(user.id);

      const { data } = await supabase
        .from("bookings")
        .select("id, scheduled_start_at, scheduled_end_at, duration_minutes, teacher:profiles!bookings_teacher_id_fkey(display_name)")
        .eq("learner_id", user.id)
        .in("status", ["confirmed", "in_session"])
        .lt("scheduled_start_at", endDate.toISOString())
        .gt("scheduled_end_at", startDate.toISOString());
      if (cancelled) return;
      if (data && data.length > 0) {
        setOverlappingBooking(data[0] as unknown as OverlappingBooking);
      }
    })();
    return () => { cancelled = true; };
  }, [open, router, startDate, endDate]);

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);
    try {
      const encoded = encodePreferences({
        v: 1,
        pace: pace || undefined,
        correction: correction || undefined,
        focus: focus.length > 0 ? focus : undefined,
        encouragement: encouragement || undefined,
        note: learnerNote.trim() || undefined,
      });
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacher_id: teacherId,
          slot_id: slot.id,
          learner_note: encoded ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create booking");
        return;
      }
      setIsConfirmed(true);
      onBooked?.();
      setTimeout(() => {
        router.push("/bookings");
      }, 1600);
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
        body: JSON.stringify({ cancellation_reason: "Replaced with a new booking" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to cancel existing booking");
        return;
      }
      setOverlappingBooking(null);
      await handleConfirm();
    } catch {
      setError("Failed to cancel existing booking");
    } finally {
      setCancellingOverlap(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-confirm-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading && !cancellingOverlap) onClose();
      }}
    >
      <div className="bg-[#111] text-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl border border-white/10 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#111]/95 backdrop-blur-sm border-b border-white/10 px-5 py-3 flex items-center justify-between">
          <h2 id="booking-confirm-title" className="text-base font-semibold">
            Confirm Booking
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading || cancellingOverlap}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-white/10 transition disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Confirmed state */}
        {isConfirmed ? (
          <div className="p-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-bold">Booking Confirmed!</h3>
            <p className="text-sm text-gray-400">Redirecting to your bookings…</p>
          </div>
        ) : overlappingBooking ? (
          /* Overlap warning */
          <div className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="font-semibold">Scheduling Conflict</h3>
                <p className="text-sm text-gray-400">
                  You already have a lesson at this time
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Existing Booking</p>
              <p className="text-sm text-white font-medium">
                {overlappingBooking.teacher?.display_name ?? "Teacher"}
              </p>
              <p className="text-xs text-gray-400">
                {new Date(overlappingBooking.scheduled_start_at).toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", timeZone: userTz,
                })}
                {" - "}
                {new Date(overlappingBooking.scheduled_end_at).toLocaleTimeString("en-US", {
                  hour: "2-digit", minute: "2-digit", timeZone: userTz,
                })}
                {" "}({overlappingBooking.duration_minutes} min)
              </p>
            </div>
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 transition"
              >
                Keep Existing Booking
              </button>
              <button
                onClick={handleCancelOverlapAndBook}
                disabled={cancellingOverlap}
                className={cn(
                  "w-full py-3 rounded-xl text-sm font-medium transition",
                  "bg-accent hover:bg-accent/90 text-white",
                  "disabled:opacity-50 flex items-center justify-center gap-2"
                )}
              >
                {cancellingOverlap ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Switching…
                  </>
                ) : (
                  "Cancel Existing & Book This One"
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Normal confirm */
          <div className="p-5 space-y-5">
            {/* Teacher card */}
            <div className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 p-4">
              {teacherAvatar ? (
                <Image
                  src={teacherAvatar}
                  alt={teacherName}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-full object-cover border-2 border-accent/30"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-7 h-7 text-accent" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{teacherName}</h3>
                {teacherHeadline && (
                  <p className="text-sm text-gray-400 truncate">{teacherHeadline}</p>
                )}
              </div>
            </div>

            {/* Lesson details */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
              <h4 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">
                Lesson Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>
                    {formattedStartTime} - {formattedEndTime} ({durationMinutes} min)
                    <span className="text-xs text-gray-500 ml-1">{tzShort}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-accent" />
                  {isBeta ? (
                    <span className="text-green-400 font-medium">Free during beta</span>
                  ) : (
                    <span>${hourlyRate / 2}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Lesson preferences — saves the teacher 5 min of warm-up */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-4">
              <h4 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">
                Lesson Preferences (optional)
              </h4>

              <div className="space-y-2">
                <p className="text-xs text-gray-400">Pace</p>
                <div className="flex flex-wrap gap-1.5">
                  {LESSON_PACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setPace((cur) => (cur === opt.value ? "" : opt.value))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                        pace === opt.value
                          ? "bg-accent border-accent text-white"
                          : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400">Corrections</p>
                <div className="flex flex-wrap gap-1.5">
                  {CORRECTION_STYLES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setCorrection((cur) => (cur === opt.value ? "" : opt.value))
                      }
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                        correction === opt.value
                          ? "bg-accent border-accent text-white"
                          : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-gray-400">Focus areas (multi)</p>
                <div className="flex flex-wrap gap-1.5">
                  {FOCUS_AREAS.map((opt) => {
                    const active = focus.includes(opt.value);
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setFocus((cur) =>
                            active
                              ? cur.filter((v) => v !== opt.value)
                              : [...cur, opt.value]
                          )
                        }
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition",
                          active
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:border-white/20"
                        )}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={encouragement}
                  onChange={(e) => setEncouragement(e.target.checked)}
                  className="accent-accent"
                />
                Encourage me — I&apos;m nervous about speaking.
              </label>
            </div>

            {/* Learner note */}
            <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h4 className="font-semibold text-gray-300 text-xs uppercase tracking-wider">
                  Note to teacher (optional)
                </h4>
              </div>
              <textarea
                value={learnerNote}
                onChange={(e) => setLearnerNote(e.target.value)}
                placeholder="Tell the teacher what you'd like to focus on…"
                maxLength={500}
                rows={3}
                className={cn(
                  "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm",
                  "placeholder-gray-500 resize-none",
                  "focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition"
                )}
              />
              <p className="text-xs text-gray-500 text-right">{learnerNote.length}/500</p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleConfirm}
              disabled={isLoading || !learnerId}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-base transition",
                "bg-accent hover:bg-accent/90 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Confirming…
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>

            <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/15 p-3 space-y-1">
              <p className="text-xs text-yellow-300/80 font-medium">Cancellation Policy</p>
              <p className="text-xs text-gray-400">
                Free cancellation up to 2 hours before the lesson.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
