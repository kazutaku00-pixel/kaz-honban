"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  FileText,
  User,
  BookOpen,
  Loader2,
  ChevronDown,
  Target,
  Sparkles,
  MessageSquare,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { BookingStatus, JapaneseLevel } from "@/types/database";

const STATUS_STYLES: Record<BookingStatus, string> = {
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_session: "bg-green-500/20 text-green-400 border-green-500/30",
  completed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  no_show: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const STATUS_LABEL_KEYS: Record<BookingStatus, string> = {
  confirmed: "bookings.confirmed",
  in_session: "bookings.inSession",
  completed: "bookings.completed",
  cancelled: "bookings.cancelled",
  no_show: "bookings.noShow",
};

interface BookingItem {
  id: string;
  learner_name: string;
  learner_avatar: string | null;
  learner_level: JapaneseLevel | null;
  learner_goals: string | null;
  learner_interests: string[] | null;
  learner_native_lang: string | null;
  learner_note: string | null;
  scheduled_start_at: string;
  scheduled_end_at: string;
  duration_minutes: number;
  status: BookingStatus;
  has_report: boolean;
}

const LEVEL_LABEL: Record<JapaneseLevel, string> = {
  none: "Beginner",
  n5: "N5",
  n4: "N4",
  n3: "N3",
  n2: "N2",
  n1: "N1",
};

export function TeacherBookingsClient({ bookings }: { bookings: BookingItem[] }) {
  const router = useRouter();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      new Date(b.scheduled_end_at) < now
  );

  const displayed = activeTab === "upcoming" ? upcoming : past;

  function isJoinable(b: BookingItem) {
    if (b.status !== "confirmed" && b.status !== "in_session") return false;
    const diff = new Date(b.scheduled_start_at).getTime() - now.getTime();
    return diff <= 15 * 60 * 1000;
  }

  async function handleJoin(bookingId: string) {
    setJoiningId(bookingId);
    try {
      router.push(`/room/${bookingId}`);
    } finally {
      setJoiningId(null);
    }
  }

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
          {t("bookings.title")}
        </h1>
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
                ? "bg-gold text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10"
            )}
          >
            {tab === "upcoming" ? t("bookings.upcoming") : t("bookings.past")}
            <span className="ml-1.5 text-xs opacity-70">
              ({tab === "upcoming" ? upcoming.length : past.length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-muted">
            {activeTab === "upcoming" ? t("bookings.noUpcoming") : t("bookings.noPast")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((booking) => {
            const start = new Date(booking.scheduled_start_at);
            return (
              <div
                key={booking.id}
                className="bg-bg-secondary rounded-2xl border border-border p-4 space-y-3"
              >
                {/* Top row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {booking.learner_avatar ? (
                      <Image
                        src={booking.learner_avatar}
                        alt={booking.learner_name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                        <User className="w-5 h-5 text-gold" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm text-text-primary">
                        {booking.learner_name}
                      </p>
                      <p className="text-xs text-text-muted">{t("bookings.learner")}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded-full border",
                      STATUS_STYLES[booking.status]
                    )}
                  >
                    {t(STATUS_LABEL_KEYS[booking.status])}
                  </span>
                </div>

                {/* Date/time */}
                <div className="flex items-center gap-4 text-sm text-text-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    {start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span>{booking.duration_minutes} min</span>
                </div>

                {/* Learner pre-lesson info */}
                {activeTab === "upcoming" && (booking.learner_level || booking.learner_goals || booking.learner_interests?.length || booking.learner_note) && (() => {
                  const isOpen = expandedId === booking.id;
                  return (
                    <div className="pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : booking.id)}
                        className="w-full flex items-center justify-between gap-2 text-xs text-text-secondary hover:text-text-primary transition py-1"
                      >
                        <span className="flex items-center gap-1.5 font-medium">
                          <User size={12} />
                          Student info
                          {booking.learner_level && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent-subtle text-accent text-[10px] font-semibold">
                              {LEVEL_LABEL[booking.learner_level]}
                            </span>
                          )}
                        </span>
                        <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="mt-2 space-y-2 text-xs">
                          {booking.learner_goals && (
                            <div className="flex gap-2">
                              <Target size={12} className="text-accent shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-text-secondary">Goals</p>
                                <p className="text-text-muted whitespace-pre-line">{booking.learner_goals}</p>
                              </div>
                            </div>
                          )}
                          {booking.learner_interests && booking.learner_interests.length > 0 && (
                            <div className="flex gap-2">
                              <Sparkles size={12} className="text-gold shrink-0 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {booking.learner_interests.map((i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-white/5 text-text-secondary text-[10px]">
                                    {i}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {booking.learner_native_lang && (
                            <div className="flex gap-2">
                              <Globe size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                              <p className="text-text-muted">
                                Native: <span className="text-text-secondary uppercase">{booking.learner_native_lang}</span>
                              </p>
                            </div>
                          )}
                          {booking.learner_note && (
                            <div className="flex gap-2">
                              <MessageSquare size={12} className="text-sky-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-text-secondary">Note from student</p>
                                <p className="text-text-muted whitespace-pre-line">{booking.learner_note}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  {activeTab === "upcoming" && isJoinable(booking) && (
                    <button
                      onClick={() => handleJoin(booking.id)}
                      disabled={joiningId === booking.id}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                        "bg-gold text-white font-medium text-sm",
                        "hover:bg-gold/90 transition disabled:opacity-50"
                      )}
                    >
                      {joiningId === booking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      {t("bookings.startLesson")}
                    </button>
                  )}

                  {booking.status === "completed" && !booking.has_report && (
                    <Link
                      href={`/teacher/bookings/${booking.id}/report`}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                        "bg-gold/10 text-gold font-medium text-sm",
                        "hover:bg-gold/20 transition"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      {t("bookings.writeReport")}
                    </Link>
                  )}

                  {booking.status === "completed" && booking.has_report && (
                    <Link
                      href={`/teacher/bookings/${booking.id}/report`}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl",
                        "bg-white/5 text-text-secondary font-medium text-sm",
                        "hover:bg-white/10 transition"
                      )}
                    >
                      <FileText className="w-4 h-4" />
                      {t("bookings.editReport")}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
