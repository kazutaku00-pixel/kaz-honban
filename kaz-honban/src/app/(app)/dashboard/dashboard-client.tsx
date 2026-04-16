"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Calendar, Clock, User, Video, X, Star, FileText,
  Loader2, BookOpen, Heart, History, ChevronDown, ChevronUp,
  ClipboardList, BarChart3, Search, ArrowRight,
} from "lucide-react";
import { TeacherCard } from "@/components/teachers/teacher-card";
import type { BookingStatus, TeacherWithProfile } from "@/types/database";

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
  lesson_report: { id: string; summary: string | null; homework: string | null } | null;
}

interface DashboardClientProps {
  bookings: BookingItem[];
  favoriteTeachers: TeacherWithProfile[];
  userId: string;
  stats: { completedLessons: number; upcomingLessons: number; favorites: number };
}

type Tab = "upcoming" | "history" | "favorites";

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_session: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  no_show: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};
const STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed", in_session: "In Session", completed: "Completed",
  cancelled: "Cancelled", no_show: "No Show",
};

const VALID_TABS: readonly Tab[] = ["upcoming", "history", "favorites"] as const;

export function DashboardClient({ bookings, favoriteTeachers, userId, stats }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = ((): Tab => {
    const t = searchParams.get("tab");
    return (VALID_TABS as readonly string[]).includes(t ?? "") ? (t as Tab) : "upcoming";
  })();
  const [tab, setTab] = useState<Tab>(initialTab);

  // Sync tab to URL without page reload
  useEffect(() => {
    const current = searchParams.get("tab");
    if (current !== tab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/dashboard?${params.toString()}`, { scroll: false });
    }
  }, [tab, router, searchParams]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const upcoming = bookings.filter(
    (b) => (b.status === "confirmed" || b.status === "in_session") && new Date(b.scheduled_end_at) >= now
  );
  const history = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      b.status === "no_show" ||
      ((b.status === "confirmed" || b.status === "in_session") && new Date(b.scheduled_end_at) < now)
  );

  const isJoinable = useCallback((b: BookingItem) => {
    if (b.status !== "confirmed" && b.status !== "in_session") return false;
    return new Date(b.scheduled_start_at).getTime() - now.getTime() <= 15 * 60 * 1000;
  }, [now]);

  async function handleCancel(bookingId: string) {
    setCancellingId(bookingId);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "PATCH" });
      if (res.ok) router.refresh();
      else { const d = await res.json(); setError(d.error || "Failed to cancel"); }
    } catch { setError("Failed to cancel booking."); }
    finally { setCancellingId(null); }
  }

  function getOther(b: BookingItem) {
    return b.learner_id === userId ? b.teacher : b.learner;
  }

  const tabs: { id: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { id: "upcoming", label: "Upcoming", icon: Calendar, count: upcoming.length },
    { id: "history", label: "History", icon: History, count: history.length },
    { id: "favorites", label: "Favorites", icon: Heart, count: favoriteTeachers.length },
  ];

  const hasUpcoming = upcoming.length > 0;
  const nextUpcoming = hasUpcoming ? upcoming[upcoming.length - 1] : null; // earliest (sorted desc)
  const nextOther = nextUpcoming ? getOther(nextUpcoming) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Hero: Next lesson if any, otherwise Find-a-teacher CTA */}
      {hasUpcoming && nextUpcoming && nextOther ? (
        <Link
          href={isJoinable(nextUpcoming) ? `/room/${nextUpcoming.id}` : `/dashboard?tab=upcoming`}
          className={cn(
            "block rounded-2xl border p-4 transition-colors",
            isJoinable(nextUpcoming)
              ? "bg-accent/10 border-accent/30 hover:bg-accent/15"
              : "bg-bg-secondary border-border hover:bg-bg-tertiary"
          )}
        >
          <div className="flex items-center gap-3">
            {nextOther.avatar_url ? (
              <Image src={nextOther.avatar_url} alt={nextOther.display_name} width={44} height={44} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(nextOther.display_name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">
                Next: {nextOther.display_name}
              </p>
              <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                <span className="flex items-center gap-1"><Calendar size={12} />{new Date(nextUpcoming.scheduled_start_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{new Date(nextUpcoming.scheduled_start_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white text-sm font-semibold flex-shrink-0">
              {isJoinable(nextUpcoming) ? <><Video size={14} />Join</> : <>View<ArrowRight size={14} /></>}
            </div>
          </div>
        </Link>
      ) : (
        <Link
          href="/teachers"
          className="block rounded-2xl p-6 bg-gradient-to-br from-accent to-orange-400 text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Search size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold leading-tight">Find your perfect teacher</p>
              <p className="text-sm text-white/85 mt-0.5">Book your first 30-min lesson today</p>
            </div>
            <ArrowRight size={20} className="flex-shrink-0" />
          </div>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Upcoming", value: stats.upcomingLessons, icon: Calendar, color: "text-blue-400" },
          { label: "Completed", value: stats.completedLessons, icon: BarChart3, color: "text-emerald-400" },
          { label: "Favorites", value: stats.favorites, icon: Heart, color: "text-accent" },
        ].map((s) => (
          <div key={s.label} className="bg-bg-secondary rounded-2xl border border-border p-4 text-center">
            <s.icon size={18} className={cn("mx-auto mb-1", s.color)} />
            <p className="text-xl font-bold text-text-primary">{s.value}</p>
            <p className="text-[10px] text-text-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-medium text-xs transition",
              tab === t.id
                ? "bg-accent text-white"
                : "bg-bg-secondary border border-border text-text-secondary hover:text-text-primary"
            )}
          >
            <t.icon size={13} />
            {t.label}
            <span className="ml-0.5 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* ── Upcoming tab ── */}
      {tab === "upcoming" && (
        upcoming.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <BookOpen className="w-10 h-10 text-text-muted mx-auto" />
            <p className="text-text-muted">No upcoming bookings</p>
            <Link href="/teachers" className="inline-block px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition">
              Find a teacher
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => {
              const other = getOther(b);
              const start = new Date(b.scheduled_start_at);
              return (
                <div key={b.id} className="rounded-2xl bg-bg-secondary border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {other?.avatar_url ? (
                        <Image src={other.avatar_url} alt={other.display_name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-accent" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-text-primary">{other?.display_name ?? "—"}</p>
                        <p className="text-xs text-text-muted">{b.teacher_id === userId ? "Student" : "Teacher"}</p>
                      </div>
                    </div>
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", STATUS_STYLES[b.status])}>
                      {STATUS_LABELS[b.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><Calendar size={12} />{start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{b.duration_minutes} min</span>
                  </div>
                  <div className="flex gap-2">
                    {isJoinable(b) && (
                      <button
                        onClick={() => { setJoiningId(b.id); router.push(`/room/${b.id}`); }}
                        disabled={joiningId === b.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition disabled:opacity-50"
                      >
                        {joiningId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                        Join Room
                      </button>
                    )}
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 text-text-muted font-medium text-sm hover:bg-red-500/10 hover:text-red-400 transition disabled:opacity-50"
                    >
                      {cancellingId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── History tab ── */}
      {tab === "history" && (
        history.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <History className="w-10 h-10 text-text-muted mx-auto" />
            <p className="text-text-muted">No lesson history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((b) => {
              const other = getOther(b);
              const start = new Date(b.scheduled_start_at);
              const isExpanded = expandedHistory === b.id;
              const hasReport = !!b.lesson_report;
              const isLearner = b.learner_id === userId;

              return (
                <div key={b.id} className="rounded-2xl bg-bg-secondary border border-border overflow-hidden">
                  <button
                    onClick={() => setExpandedHistory(isExpanded ? null : b.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    {other?.avatar_url ? (
                      <Image src={other.avatar_url} alt={other.display_name ?? ""} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                        <User className="w-5 h-5 text-accent" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-text-primary text-sm truncate">{other?.display_name ?? "—"}</p>
                        {b.lesson_report?.homework && (
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-gold/20 text-gold rounded-full shrink-0">Homework</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                        <span className="flex items-center gap-1"><Calendar size={11} />{start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{b.duration_minutes} min</span>
                        <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", STATUS_STYLES[b.status])}>{STATUS_LABELS[b.status]}</span>
                      </div>
                    </div>
                    {hasReport ? (isExpanded ? <ChevronUp size={16} className="text-text-muted shrink-0" /> : <ChevronDown size={16} className="text-text-muted shrink-0" />) : null}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      {b.lesson_report?.summary && (
                        <div>
                          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-1">Summary</p>
                          <p className="text-sm text-text-secondary">{b.lesson_report.summary}</p>
                        </div>
                      )}
                      {b.lesson_report?.homework && (
                        <div>
                          <p className="text-xs font-medium text-gold uppercase tracking-wider mb-1 flex items-center gap-1">
                            <ClipboardList size={11} /> Homework
                          </p>
                          <p className="text-sm text-text-secondary">{b.lesson_report.homework}</p>
                        </div>
                      )}
                      {b.status === "completed" && isLearner && !b.review && (
                        <Link
                          href={`/bookings/${b.id}/review`}
                          className="flex items-center gap-2 py-2 px-3 rounded-xl bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition"
                        >
                          <Star size={12} /> Write Review
                        </Link>
                      )}
                      {b.lesson_report && (
                        <Link
                          href={`/teacher/bookings/${b.id}/report`}
                          className="flex items-center gap-2 py-2 px-3 rounded-xl bg-white/5 text-text-secondary text-xs font-medium hover:bg-white/10 transition"
                        >
                          <FileText size={12} /> View Full Report
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Favorites tab ── */}
      {tab === "favorites" && (
        favoriteTeachers.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <Heart className="w-10 h-10 text-text-muted mx-auto" />
            <p className="text-text-muted">No favorites yet</p>
            <Link href="/teachers" className="inline-block px-6 py-2.5 rounded-xl bg-accent text-white font-medium text-sm hover:bg-accent/90 transition">
              Browse Teachers
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {favoriteTeachers.map((t, i) => (
              <TeacherCard key={t.id} teacher={t} index={i} isFavorited={true} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
