"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Clock,
  AlertTriangle,
  Loader2,
  CalendarDays,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { supportMailto, SUPPORT_EMAIL } from "@/lib/support";
import {
  decodePreferences,
  paceLabel,
  correctionLabel,
  focusLabel,
} from "@/lib/lesson-preferences";
import { HelperPhrasesPanel } from "@/components/room/helper-phrases";

interface RoomData {
  url: string;
  token: string;
  roomName: string;
}

interface BookingInfo {
  id: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  teacher_id: string;
  learner_id: string;
  teacher: { display_name: string; avatar_url: string | null } | null;
  learner: { display_name: string; avatar_url: string | null } | null;
}

export default function VideoRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { t: tr } = useI18n();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [phase, setPhase] = useState<"loading" | "prejoin" | "joined" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [timerPhase, setTimerPhase] = useState<"normal" | "warning" | "ending" | "overtime">("normal");
  const [lateMessage, setLateMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [learnerContext, setLearnerContext] = useState<{
    learner_note: string | null;
    learner_level: string | null;
    learner_goals: string | null;
    learner_interests: string[] | null;
  } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch booking info
  useEffect(() => {
    async function fetchBooking() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUserId(user.id);

        const { data } = await supabase
          .from("bookings")
          .select(`*, teacher:profiles!bookings_teacher_id_fkey(*), learner:profiles!bookings_learner_id_fkey(*)`)
          .eq("id", bookingId)
          .single();

        if (!data) {
          setError("Booking not found");
          setPhase("error");
          return;
        }

        setBooking(data as unknown as BookingInfo);
        setPhase("prejoin");
      } catch {
        setError("Failed to load booking");
        setPhase("error");
      }
    }
    fetchBooking();
  }, [bookingId, router]);

  // Teacher-only: fetch learner context for pre-join briefing
  useEffect(() => {
    if (phase !== "prejoin" || !booking || !userId) return;
    if (userId !== booking.teacher_id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}/learner-context`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setLearnerContext(data);
      } catch { /* silent — this card is a nice-to-have */ }
    })();
    return () => { cancelled = true; };
  }, [phase, booking, userId, bookingId]);

  // Device check — distinguish permission denial from hardware absence
  useEffect(() => {
    if (phase !== "prejoin") return;
    async function checkDevices() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setDeviceError("Your browser does not support camera and microphone access.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCamera(true);
        setHasMic(true);
        setDeviceError(null);
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const name = (err as { name?: string })?.name ?? "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setDeviceError("Camera/microphone access was blocked. Please allow access in your browser settings and reload.");
          return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMic(true);
          setDeviceError("No camera detected. You can still join with audio only.");
          stream.getTracks().forEach((t) => t.stop());
        } catch (err2) {
          const name2 = (err2 as { name?: string })?.name ?? "";
          if (name2 === "NotAllowedError" || name2 === "SecurityError") {
            setDeviceError("Camera/microphone access was blocked. Please allow access in your browser settings and reload.");
          } else {
            setDeviceError("No camera or microphone detected. Check your device and reload.");
          }
        }
      }
    }
    checkDevices();
  }, [phase]);

  // Timer with phase warnings
  useEffect(() => {
    if (phase !== "joined" || !booking) return;
    function updateTimer() {
      if (!booking) return;
      const endTime = new Date(booking.scheduled_end_at).getTime();
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        // Overtime — count up
        const overMs = Math.abs(diff);
        const overMins = Math.floor(overMs / 60000);
        const overSecs = Math.floor((overMs % 60000) / 1000);
        setRemainingTime(`+${String(overMins).padStart(2, "0")}:${String(overSecs).padStart(2, "0")}`);
        setTimerPhase("overtime");
        return;
      }

      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);

      if (diff <= 2 * 60 * 1000) {
        setTimerPhase("ending");
        // Vibrate at exactly 2:00
        if (mins === 2 && secs === 0 && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      } else if (diff <= 5 * 60 * 1000) {
        setTimerPhase("warning");
        // Vibrate at exactly 5:00
        if (mins === 5 && secs === 0 && typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(200);
        }
      } else {
        setTimerPhase("normal");
      }
    }
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, booking]);

  // Late indicator — tiered guidance, re-evaluates every 30s
  useEffect(() => {
    if (!booking) return;
    const startTime = new Date(booking.scheduled_start_at).getTime();
    const isTeacher = userId === booking.teacher_id;
    const other = isTeacher ? "Student" : "Teacher";

    function recompute() {
      if (!booking) return;
      const elapsed = Date.now() - startTime;
      if (elapsed < 3 * 60 * 1000) {
        setLateMessage(null);
        return;
      }
      const lateMinutes = Math.floor(elapsed / 60000);
      if (elapsed >= 15 * 60 * 1000) {
        setLateMessage(
          `${other} is ${lateMinutes} min late. You can mark this as a no-show from your bookings page.`
        );
      } else if (elapsed >= 10 * 60 * 1000) {
        setLateMessage(
          `${other} is ${lateMinutes} min late. Try sending a message while you wait.`
        );
      } else {
        setLateMessage(`${other} is ${lateMinutes} min late. Please wait a few minutes.`);
      }
    }
    recompute();
    const id = setInterval(recompute, 30_000);
    return () => clearInterval(id);
  }, [booking, userId]);

  const handleJoin = useCallback(async () => {
    setJoining(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to join room");
        setPhase("error");
        return;
      }
      setRoomData(data);
      setPhase("joined");
    } catch {
      setError("Failed to join room");
      setPhase("error");
    } finally {
      setJoining(false);
    }
  }, [bookingId]);

  const handleLeave = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    // Teacher → lesson report, Learner → review
    const isTeacher = userId === booking?.teacher_id;
    if (isTeacher) {
      router.push(`/teacher/bookings/${bookingId}/report`);
    } else {
      router.push(`/bookings/${bookingId}/review`);
    }
  }, [bookingId, router, userId, booking]);

  // Daily Prebuilt sends a postMessage when the user clicks its built-in
  // hangup button. Catch it so we redirect straight to review / report
  // instead of stranding the user on Daily's "You left the call" screen.
  useEffect(() => {
    if (phase !== "joined") return;
    function onMessage(e: MessageEvent) {
      const d = e.data as { fromPrebuilt?: boolean; what?: string; action?: string } | null;
      const what = d?.what ?? d?.action;
      if (d?.fromPrebuilt && (what === "left-meeting" || what === "meeting-ended")) {
        handleLeave();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [phase, handleLeave]);

  // Esc closes the leave-confirm dialog
  useEffect(() => {
    if (!showLeaveConfirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowLeaveConfirm(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showLeaveConfirm]);

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-accent mx-auto" />
          <p className="text-text-muted">{tr("room.loading")}</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
        <div className="max-w-sm text-center space-y-4 px-6">
          <AlertTriangle size={48} className="text-red-400 mx-auto" />
          <p className="text-text-primary font-semibold">{tr("room.errorTitle")}</p>
          <p className="text-sm text-text-muted">{error}</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                setError(null);
                setPhase(booking ? "prejoin" : "loading");
                if (!booking) {
                  router.refresh();
                }
              }}
              className="px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition"
            >
              {tr("room.tryAgain")}
            </button>
            <button
              onClick={() => router.push("/bookings")}
              className="px-6 py-3 rounded-xl bg-white/5 text-text-secondary font-medium text-sm hover:bg-white/10 transition"
            >
              {tr("room.back")}
            </button>
            <a
              href={supportMailto(`Lesson room issue – booking ${bookingId}`)}
              className="text-xs text-text-muted hover:text-text-secondary underline underline-offset-2"
            >
              Still stuck? Contact {SUPPORT_EMAIL}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "prejoin" && booking) {
    const otherPerson = userId === booking.teacher_id ? booking.learner : booking.teacher;
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
        <div className="max-w-md w-full mx-4 space-y-6">
          {/* Booking info */}
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
            <h1 className="text-xl font-bold text-text-primary font-[family-name:var(--font-display)] text-center">
              {tr("room.readyToJoin")}
            </h1>
            <div className="flex items-center gap-4 justify-center">
              {otherPerson?.avatar_url ? (
                <Image
                  src={otherPerson.avatar_url}
                  alt={otherPerson.display_name}
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-2xl">
                  {(otherPerson?.display_name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-text-primary">
                  {otherPerson?.display_name}
                </p>
                <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={14} />
                    {new Date(booking.scheduled_start_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} />
                    {new Date(booking.scheduled_start_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  {booking.duration_minutes} minutes
                </p>
              </div>
            </div>
          </div>

          {/* Learner context card (teacher only) */}
          {userId === booking.teacher_id && learnerContext &&
            (learnerContext.learner_level ||
              learnerContext.learner_goals ||
              (learnerContext.learner_interests?.length ?? 0) > 0 ||
              learnerContext.learner_note) && (
            <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-3">
              <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
                Student Context
              </h2>
              {learnerContext.learner_level && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Level</p>
                  <p className="text-sm text-text-primary font-medium uppercase">
                    {learnerContext.learner_level}
                  </p>
                </div>
              )}
              {learnerContext.learner_goals && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Goals</p>
                  <p className="text-sm text-text-secondary whitespace-pre-line">
                    {learnerContext.learner_goals}
                  </p>
                </div>
              )}
              {learnerContext.learner_interests && learnerContext.learner_interests.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {learnerContext.learner_interests.map((i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px]">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {learnerContext.learner_note && (() => {
                const prefs = decodePreferences(learnerContext.learner_note);
                if (!prefs) return null;
                const hasStructured =
                  prefs.pace ||
                  prefs.correction ||
                  (prefs.focus && prefs.focus.length > 0) ||
                  prefs.encouragement;
                return (
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-text-muted">
                      Lesson preferences
                    </p>
                    {hasStructured && (
                      <div className="flex flex-wrap gap-1.5">
                        {prefs.pace && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px]">
                            {paceLabel(prefs.pace)}
                          </span>
                        )}
                        {prefs.correction && (
                          <span className="px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px]">
                            {correctionLabel(prefs.correction)}
                          </span>
                        )}
                        {prefs.focus?.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px]"
                          >
                            {focusLabel(f)}
                          </span>
                        ))}
                        {prefs.encouragement && (
                          <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px]">
                            Wants encouragement
                          </span>
                        )}
                      </div>
                    )}
                    {prefs.note && (
                      <p className="text-sm text-text-secondary italic whitespace-pre-line">
                        &ldquo;{prefs.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Device status */}
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              {tr("room.deviceCheck")}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCameraOn(!cameraOn)}
                aria-label={cameraOn ? "Turn camera off" : "Turn camera on"}
                aria-pressed={cameraOn}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition",
                  hasCamera
                    ? cameraOn
                      ? "bg-green-500/10 text-green-400"
                      : "bg-white/5 text-text-muted"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {cameraOn && hasCamera ? <Video size={24} /> : <VideoOff size={24} />}
                <span className="text-xs font-medium">
                  {hasCamera ? (cameraOn ? tr("room.cameraOn") : tr("room.cameraOff")) : tr("room.noCamera")}
                </span>
              </button>
              <button
                onClick={() => setMicOn(!micOn)}
                aria-label={micOn ? "Mute microphone" : "Unmute microphone"}
                aria-pressed={micOn}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl transition",
                  hasMic
                    ? micOn
                      ? "bg-green-500/10 text-green-400"
                      : "bg-white/5 text-text-muted"
                    : "bg-red-500/10 text-red-400"
                )}
              >
                {micOn && hasMic ? <Mic size={24} /> : <MicOff size={24} />}
                <span className="text-xs font-medium">
                  {hasMic ? (micOn ? tr("room.micOn") : tr("room.micOff")) : tr("room.noMic")}
                </span>
              </button>
            </div>
          </div>

          {/* Device error */}
          {deviceError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 text-red-300 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{deviceError}</span>
            </div>
          )}

          {/* Late message */}
          {lateMessage && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-2 text-yellow-400 text-sm">
              <AlertTriangle size={16} />
              {lateMessage}
            </div>
          )}

          {/* Join button */}
          <button
            onClick={handleJoin}
            disabled={joining}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl",
              "bg-accent text-white font-bold text-base",
              "hover:bg-accent/90 transition",
              "disabled:opacity-50"
            )}
          >
            {joining ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Video size={20} />
            )}
            {tr("room.join")}
          </button>

          <button
            onClick={() => router.push("/bookings")}
            className="w-full py-3 text-center text-sm text-text-muted hover:text-text-secondary transition"
          >
            {tr("room.back")}
          </button>
        </div>
      </div>
    );
  }

  // Joined — Daily Prebuilt iframe fills the viewport. Chat, screen share,
  // reactions, etc. all live inside Daily's own UI, so we only render a thin
  // top bar for the lesson timer + leave button.
  if (phase === "joined" && roomData && booking) {
    const iframeSrc = `${roomData.url}?t=${encodeURIComponent(roomData.token)}`;
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary/90 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-text-primary font-medium">{tr("room.live")}</span>
          </div>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-lg transition-all",
            timerPhase === "normal" && "text-text-primary",
            timerPhase === "warning" && "text-amber-400 bg-amber-500/10",
            timerPhase === "ending" && "text-red-400 bg-red-500/10 animate-pulse",
            timerPhase === "overtime" && "text-red-400 bg-red-500/20 animate-pulse"
          )}>
            <Clock size={14} />
            <span className="text-sm font-mono font-bold">{remainingTime}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            aria-label={tr("room.leave")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition text-sm font-medium"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">{tr("room.leave")}</span>
          </button>
        </div>

        {lateMessage && (
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-sm text-center">
            {lateMessage}
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={iframeSrc}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 border-0"
        />

        {/* Floating Japanese phrase helper — only meaningful for the learner. */}
        {userId === booking.learner_id && <HelperPhrasesPanel />}

        {showLeaveConfirm && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="leave-confirm-title"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowLeaveConfirm(false);
            }}
          >
            <div className="bg-bg-secondary border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                  <LogOut size={18} className="text-red-400" />
                </div>
                <h3 id="leave-confirm-title" className="text-base font-semibold text-text-primary">
                  {tr("room.leaveConfirmTitle")}
                </h3>
              </div>
              <p className="text-sm text-text-muted">{tr("room.leaveConfirmBody")}</p>
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-text-secondary text-sm font-medium hover:bg-white/10 transition"
                >
                  {tr("room.leaveConfirmCancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    handleLeave();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-500/90 transition"
                >
                  {tr("room.leaveConfirmAction")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
