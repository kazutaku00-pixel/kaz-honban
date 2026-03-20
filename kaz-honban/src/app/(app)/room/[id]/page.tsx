"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Clock,
  AlertTriangle,
  Loader2,
  User,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

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
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [phase, setPhase] = useState<"loading" | "prejoin" | "joined" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasMic, setHasMic] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [lateMessage, setLateMessage] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
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

  // Device check
  useEffect(() => {
    if (phase !== "prejoin") return;
    async function checkDevices() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCamera(true);
        setHasMic(true);
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMic(true);
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          // No devices
        }
      }
    }
    checkDevices();
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "joined" || !booking) return;
    function updateTimer() {
      if (!booking) return;
      const endTime = new Date(booking.scheduled_end_at).getTime();
      const now = Date.now();
      const diff = endTime - now;
      if (diff <= 0) {
        setRemainingTime("00:00");
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }
    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, booking]);

  // Late indicator
  useEffect(() => {
    if (!booking) return;
    const startTime = new Date(booking.scheduled_start_at).getTime();
    const now = Date.now();
    if (now > startTime + 3 * 60 * 1000) {
      const lateMinutes = Math.floor((now - startTime) / 60000);
      const isTeacher = userId === booking.teacher_id;
      if (!isTeacher) {
        setLateMessage(`Teacher is ${lateMinutes} minutes late`);
      }
    }
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

  if (phase === "loading") {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <Loader2 size={40} className="animate-spin text-accent mx-auto" />
          <p className="text-text-muted">Loading room...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="fixed inset-0 bg-bg-primary flex items-center justify-center z-50">
        <div className="max-w-sm text-center space-y-4 px-6">
          <AlertTriangle size={48} className="text-red-400 mx-auto" />
          <p className="text-text-primary font-semibold">Something went wrong</p>
          <p className="text-sm text-text-muted">{error}</p>
          <button
            onClick={() => router.push("/bookings")}
            className="px-6 py-3 rounded-xl bg-white/5 text-text-secondary font-medium text-sm hover:bg-white/10 transition"
          >
            Back to Bookings
          </button>
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
              Ready to join?
            </h1>
            <div className="flex items-center gap-4 justify-center">
              {otherPerson?.avatar_url ? (
                <img
                  src={otherPerson.avatar_url}
                  alt={otherPerson.display_name}
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

          {/* Device status */}
          <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              Device Check
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCameraOn(!cameraOn)}
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
                  {hasCamera ? (cameraOn ? "Camera On" : "Camera Off") : "No Camera"}
                </span>
              </button>
              <button
                onClick={() => setMicOn(!micOn)}
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
                  {hasMic ? (micOn ? "Mic On" : "Mic Off") : "No Mic"}
                </span>
              </button>
            </div>
          </div>

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
            Join Room
          </button>

          <button
            onClick={() => router.push("/bookings")}
            className="w-full py-3 text-center text-sm text-text-muted hover:text-text-secondary transition"
          >
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  // Joined - show Daily iframe
  if (phase === "joined" && roomData) {
    const iframeSrc = `${roomData.url}?t=${roomData.token}`;
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary/90 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-text-primary font-medium">Live</span>
          </div>
          <div className="flex items-center gap-2 text-text-primary">
            <Clock size={14} />
            <span className="text-sm font-mono font-bold">{remainingTime}</span>
          </div>
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 font-medium text-sm hover:bg-red-500/30 transition"
          >
            <PhoneOff size={14} />
            Leave
          </button>
        </div>

        {/* Late indicator */}
        {lateMessage && (
          <div className="px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-sm text-center">
            {lateMessage}
          </div>
        )}

        {/* Daily iframe */}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          className="flex-1 w-full border-0"
        />
      </div>
    );
  }

  return null;
}
