import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  Video,
  Star,
  FileText,
  User,
  Settings,
  Calendar,
  TrendingUp,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n-text";
import type { Profile, Booking, TeacherProfile } from "@/types/database";

export default async function TeacherDashboard() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify teacher role
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "teacher");

  if (!roles?.length) redirect("/dashboard");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const profile = profileRaw as unknown as Profile | null;

  const { data: teacherProfileRaw } = await supabase
    .from("teacher_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const teacherProfile = teacherProfileRaw as unknown as TeacherProfile | null;

  // Today's bookings
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const { data: todayBookingsRaw } = await supabase
    .from("bookings")
    .select(`*, learner:profiles!bookings_learner_id_fkey(*)`)
    .eq("teacher_id", user.id)
    .in("status", ["confirmed", "in_session"])
    .gte("scheduled_start_at", todayStart.toISOString())
    .lte("scheduled_start_at", todayEnd.toISOString())
    .order("scheduled_start_at", { ascending: true });

  const todayBookings = (todayBookingsRaw ?? []) as unknown as (Booking & { learner: Profile })[];

  // Next student (next upcoming booking)
  const nextStudent = todayBookings.find(
    (b) => new Date(b.scheduled_start_at).getTime() > Date.now()
  ) ?? todayBookings[0] ?? null;

  // Monthly stats
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: monthlyLessons } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("teacher_id", user.id)
    .eq("status", "completed")
    .gte("scheduled_start_at", monthStart.toISOString());

  // Pending reports (completed bookings without lesson reports)
  const { data: completedBookingsRaw } = await supabase
    .from("bookings")
    .select(`*, learner:profiles!bookings_learner_id_fkey(*), lesson_report:lesson_reports(*)`)
    .eq("teacher_id", user.id)
    .eq("status", "completed")
    .order("scheduled_start_at", { ascending: false })
    .limit(10);

  const pendingReports = ((completedBookingsRaw ?? []) as unknown as (Booking & {
    learner: Profile;
    lesson_report: { id: string }[] | null;
  })[]).filter(
    (b) => !b.lesson_report || (Array.isArray(b.lesson_report) && b.lesson_report.length === 0)
  );

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  function isJoinable(startAt: string) {
    const diff = new Date(startAt).getTime() - Date.now();
    return diff <= 15 * 60 * 1000;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome — Teacher header with gold accent */}
      <div className="bg-gradient-to-r from-gold/10 to-transparent rounded-2xl border border-gold/20 p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
            <GraduationCap size={20} className="text-gold" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-[family-name:var(--font-display)] text-text-primary">
              <T k="dashboard.hello" />, {profile?.display_name?.split(" ")[0] ?? "Teacher"}
            </h1>
            <p className="text-sm text-text-muted">{today}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/teacher/schedule"
          className="flex items-center gap-3 bg-bg-secondary rounded-2xl border border-gold/20 p-4 hover:border-gold/40 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Calendar size={20} className="text-gold" />
          </div>
          <span className="text-sm font-medium text-text-primary"><T k="dashboard.editSchedule" /></span>
        </Link>
        <Link
          href="/teacher/profile"
          className="flex items-center gap-3 bg-bg-secondary rounded-2xl border border-gold/20 p-4 hover:border-gold/40 transition"
        >
          <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
            <Settings size={20} className="text-gold" />
          </div>
          <span className="text-sm font-medium text-text-primary"><T k="dashboard.editProfile" /></span>
        </Link>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-bg-secondary rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">{monthlyLessons ?? 0}</p>
          <p className="text-xs text-text-muted mt-1"><T k="dashboard.thisMonth" /></p>
        </div>
        <div className="bg-bg-secondary rounded-2xl border border-border p-4 text-center">
          <div className="flex items-center justify-center gap-1">
            <Star size={16} className="text-gold fill-gold" />
            <span className="text-2xl font-bold text-text-primary">
              {teacherProfile?.avg_rating?.toFixed(1) ?? "—"}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1"><T k="dashboard.avgRating" /></p>
        </div>
        <div className="bg-bg-secondary rounded-2xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-primary">
            {teacherProfile?.total_lessons ?? 0}
          </p>
          <p className="text-xs text-text-muted mt-1"><T k="dashboard.total" /></p>
        </div>
      </div>

      {/* Next Student */}
      {nextStudent && (
        <div className="bg-bg-secondary rounded-2xl border border-border p-6 space-y-4">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
            <T k="dashboard.nextStudent" />
          </h2>
          <div className="flex items-center gap-4">
            {nextStudent.learner?.avatar_url ? (
              <img
                src={nextStudent.learner.avatar_url}
                alt={nextStudent.learner.display_name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500 to-blue-400 flex items-center justify-center text-white font-bold text-xl">
                {(nextStudent.learner?.display_name ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-text-primary truncate">
                {nextStudent.learner?.display_name}
              </p>
              <div className="flex items-center gap-3 text-sm text-text-muted mt-1">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {new Date(nextStudent.scheduled_start_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span>{nextStudent.duration_minutes} min</span>
              </div>
            </div>
          </div>
          {nextStudent.learner_note && (
            <p className="text-sm text-text-secondary bg-white/5 rounded-xl p-3">
              {nextStudent.learner_note}
            </p>
          )}
          {isJoinable(nextStudent.scheduled_start_at) && (
            <Link
              href={`/room/${nextStudent.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold text-white font-semibold text-sm hover:bg-gold/90 transition"
            >
              <Video size={18} />
              <T k="dashboard.startLesson" />
            </Link>
          )}
        </div>
      )}

      {/* Today's Schedule */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          <T k="dashboard.todaySchedule" /> ({todayBookings.length})
        </h2>
        {todayBookings.length === 0 ? (
          <div className="bg-bg-secondary rounded-2xl border border-border p-8 text-center">
            <CalendarDays size={32} className="mx-auto text-text-muted mb-3" />
            <p className="text-text-muted"><T k="dashboard.noLessons" /></p>
          </div>
        ) : (
          todayBookings.map((booking) => (
            <div
              key={booking.id}
              className="flex items-center gap-4 bg-bg-secondary rounded-2xl border border-border p-4"
            >
              <div className="text-center min-w-[56px]">
                <p className="text-sm font-bold text-text-primary">
                  {new Date(booking.scheduled_start_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <p className="text-xs text-text-muted">{booking.duration_minutes}m</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {booking.learner?.display_name}
                </p>
                <p className={cn(
                  "text-xs font-medium mt-0.5",
                  booking.status === "in_session" ? "text-green-400" : "text-blue-400"
                )}>
                  {booking.status === "in_session" ? <T k="dashboard.inSession" /> : <T k="dashboard.confirmed" />}
                </p>
              </div>
              {isJoinable(booking.scheduled_start_at) && (
                <Link
                  href={`/room/${booking.id}`}
                  className="px-4 py-2 rounded-xl bg-gold text-white text-sm font-medium hover:bg-gold/90 transition"
                >
                  <T k="dashboard.join" />
                </Link>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pending Reports */}
      {pendingReports.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
              <T k="dashboard.pendingReports" />
            </h2>
            <span className="px-2 py-0.5 text-xs font-medium bg-gold/20 text-gold rounded-full">
              {pendingReports.length}
            </span>
          </div>
          {pendingReports.slice(0, 5).map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between bg-bg-secondary rounded-2xl border border-border p-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle size={16} className="text-gold" />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {booking.learner?.display_name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {new Date(booking.scheduled_start_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <Link
                href={`/teacher/bookings/${booking.id}/report`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition"
              >
                <FileText size={14} />
                <T k="dashboard.write" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
