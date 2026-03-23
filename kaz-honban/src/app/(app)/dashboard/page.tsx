import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Video,
  Heart,
  BookOpen,
  GraduationCap,
  Star,
  ArrowRight,
  Search,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n-text";
import { LocalTime } from "@/components/ui/local-time";
import type { Profile, TeacherProfile, Booking, LessonReport } from "@/types/database";

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

function isJoinable(startAt: string) {
  const diff = new Date(startAt).getTime() - Date.now();
  return diff <= 15 * 60 * 1000;
}

export default async function LearnerDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all data in parallel for performance
  const [
    { data: profileRaw },
    { data: upcomingRaw },
    { data: reportsRaw },
    { data: teachersRaw },
    { count: totalLessons },
    { count: favoriteCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("bookings")
      .select(
        `*, teacher:profiles!bookings_teacher_id_fkey(*), teacher_profile:teacher_profiles!bookings_teacher_id_fkey(*)`
      )
      .eq("learner_id", user.id)
      .in("status", ["confirmed", "in_session"])
      .gte("scheduled_start_at", new Date().toISOString())
      .order("scheduled_start_at", { ascending: true })
      .limit(1),
    supabase
      .from("lesson_reports")
      .select(
        `*, booking:bookings!inner(learner_id, teacher_id, scheduled_start_at), teacher_profile:teacher_profiles!lesson_reports_teacher_id_fkey(user_id), teacher:profiles!lesson_reports_teacher_id_fkey(*)`
      )
      .not("homework", "is", null)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("teacher_profiles")
      .select("*, profile:profiles!teacher_profiles_user_id_fkey(*)")
      .eq("approval_status", "approved")
      .eq("is_public", true)
      .limit(3),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", user.id)
      .eq("status", "completed"),
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", user.id),
  ]);

  const profile = profileRaw as unknown as Profile | null;

  const nextBooking = (upcomingRaw?.[0] as unknown as (Booking & { teacher: Profile; teacher_profile: TeacherProfile }) | undefined) ?? null;

  const recentHomework = ((reportsRaw ?? []) as unknown as (LessonReport & {
    booking: { learner_id: string; teacher_id: string; scheduled_start_at: string };
    teacher: Profile;
  })[]).filter((r) => r.booking?.learner_id === user.id);

  const recommendedTeachers = (teachersRaw ?? []) as unknown as (TeacherProfile & { profile: Profile })[];

  const displayName = profile?.display_name ?? "there";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome — Student header with accent */}
      <div className="bg-gradient-to-r from-accent/10 to-transparent rounded-2xl border border-accent/20 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <BookOpen size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              <T k="learner.welcome" />, {firstName}
            </h1>
            <p className="text-sm text-text-muted">
              <T k="learner.ready" />
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-bg-secondary rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <GraduationCap size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{totalLessons ?? 0}</p>
            <p className="text-xs text-text-muted"><T k="learner.lessons" /></p>
          </div>
        </div>
        <div className="bg-bg-secondary rounded-2xl border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Heart size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-xl font-bold text-text-primary">{favoriteCount ?? 0}</p>
            <p className="text-xs text-text-muted"><T k="learner.favorites" /></p>
          </div>
        </div>
      </div>

      {/* Next Lesson */}
      {nextBooking ? (
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              <T k="learner.nextLesson" />
            </h2>
            <span className="text-xs text-accent font-medium">
              {formatCountdown(nextBooking.scheduled_start_at)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {nextBooking.teacher?.avatar_url ? (
              <img
                src={nextBooking.teacher.avatar_url}
                alt={nextBooking.teacher.display_name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-xl">
                {(nextBooking.teacher?.display_name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary truncate">
                {nextBooking.teacher?.display_name}
              </p>
              <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                <span className="flex items-center gap-1">
                  <CalendarDays size={14} />
                  <LocalTime isoString={nextBooking.scheduled_start_at} format="date" />
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  <LocalTime isoString={nextBooking.scheduled_start_at} format="time" />
                </span>
              </div>
            </div>
          </div>
          {isJoinable(nextBooking.scheduled_start_at) ? (
            <Link
              href={`/room/${nextBooking.id}`}
              className={cn(
                "flex items-center justify-center gap-2 w-full py-3 rounded-xl",
                "bg-accent text-white font-semibold text-sm",
                "hover:bg-accent/90 transition"
              )}
            >
              <Video size={18} />
              <T k="learner.joinRoom" />
            </Link>
          ) : (
            <Link
              href="/bookings"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 text-text-secondary font-medium text-sm hover:bg-white/10 transition"
            >
              <T k="learner.viewBooking" />
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Search size={28} className="text-accent" />
          </div>
          <div>
            <p className="font-semibold text-text-primary">
              <T k="learner.findTeacher" />
            </p>
            <p className="text-sm text-text-muted mt-1">
              <T k="learner.browseDesc" />
            </p>
          </div>
          <Link
            href="/teachers"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition"
          >
            <T k="learner.browseTeachers" />
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Recent Homework */}
      {recentHomework.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              <T k="learner.recentHomework" />
            </h2>
            <Link href="/history" className="text-xs text-accent hover:underline">
              <T k="learner.viewAll" />
            </Link>
          </div>
          {recentHomework.map((report) => (
            <div
              key={report.id}
              className="bg-bg-secondary rounded-2xl border border-border p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList size={16} className="text-gold" />
                  <span className="text-sm font-medium text-text-primary">
                    {report.teacher?.display_name}
                  </span>
                </div>
                <span className="text-xs text-text-muted">
                  {new Date(report.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <p className="text-sm text-text-secondary line-clamp-2">
                {report.homework}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Recommended Teachers */}
      {recommendedTeachers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              <T k="learner.recommended" />
            </h2>
            <Link href="/teachers" className="text-xs text-accent hover:underline">
              <T k="learner.seeAll" />
            </Link>
          </div>
          <div className="grid gap-3">
            {recommendedTeachers.map((teacher) => (
              <Link
                key={teacher.id}
                href={`/teachers/${teacher.user_id}`}
                className="flex items-center gap-4 bg-bg-secondary rounded-2xl border border-border p-4 hover:border-border-hover hover:bg-bg-tertiary transition"
              >
                {teacher.profile?.avatar_url ? (
                  <img
                    src={teacher.profile.avatar_url}
                    alt={teacher.profile.display_name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-lg">
                    {(teacher.profile?.display_name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-text-primary truncate">
                    {teacher.profile?.display_name}
                  </p>
                  <p className="text-sm text-text-muted truncate">
                    {teacher.headline}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-gold fill-gold" />
                    <span className="text-xs text-text-secondary">
                      {teacher.avg_rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-text-primary mt-1">
                    ${teacher.hourly_rate}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
