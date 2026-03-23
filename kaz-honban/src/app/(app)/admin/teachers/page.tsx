import { createServiceRoleClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { TeacherActions } from "@/components/admin/teacher-actions";
import { TeacherAdminActions } from "@/components/admin/teacher-admin-actions";
import { Star } from "lucide-react";
import type { TeacherApprovalStatus } from "@/types/database";

interface SearchParams {
  tab?: string;
}

const STATUS_BADGES: Record<TeacherApprovalStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-white/10 text-text-muted" },
  submitted: { label: "Pending", className: "bg-yellow-500/20 text-yellow-400" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejected", className: "bg-red-500/20 text-red-400" },
  suspended: { label: "Suspended", className: "bg-orange-500/20 text-orange-400" },
};

export default async function AdminTeachersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { tab = "pending" } = await searchParams;
  const admin = createServiceRoleClient();

  let query = admin
    .from("teacher_profiles")
    .select("*, profile:profiles!teacher_profiles_user_id_fkey(display_name, email, avatar_url)")
    .order("created_at", { ascending: false });

  if (tab === "pending") {
    query = query.eq("approval_status", "submitted");
  } else if (tab === "approved") {
    query = query.eq("approval_status", "approved");
  } else if (tab === "suspended") {
    query = query.eq("approval_status", "suspended");
  } else if (tab === "rejected") {
    query = query.eq("approval_status", "rejected");
  }

  const { data: teachersRaw, error } = await query;
  const teachers = teachersRaw as unknown as {
    id: string;
    user_id: string;
    headline: string | null;
    bio: string | null;
    categories: string[];
    languages: string[];
    levels: string[];
    approval_status: TeacherApprovalStatus;
    is_public: boolean;
    avg_rating: number;
    review_count: number;
    total_lessons: number;
    hourly_rate: number;
    created_at: string;
    profile: { display_name: string; email: string; avatar_url: string | null } | null;
  }[] | null;

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "suspended", label: "Suspended" },
    { key: "rejected", label: "Rejected" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="md:ml-56">
      <h1 className="text-2xl font-bold text-text-primary mb-6 font-[family-name:var(--font-display)]">
        Teachers Management
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <a
            key={t.key}
            href={`/admin/teachers?tab=${t.key}`}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.key
                ? "bg-accent text-white"
                : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
            )}
          >
            {t.label}
          </a>
        ))}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
          Failed to load teachers: {error.message}
        </div>
      )}

      <div className="space-y-3">
        {teachers && teachers.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            No teachers found for this filter.
          </div>
        )}

        {teachers?.map((teacher) => {
          const profile = teacher.profile;
          const badge = STATUS_BADGES[teacher.approval_status];

          return (
            <div
              key={teacher.id}
              className="bg-bg-secondary rounded-xl border border-border p-5 space-y-3"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center text-gold text-lg font-semibold flex-shrink-0">
                      {profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary">
                        {profile?.display_name || "Unknown"}
                      </span>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                          badge?.className
                        )}
                      >
                        {badge?.label}
                      </span>
                      {teacher.is_public && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400">
                          Public
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted">{profile?.email}</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-text-secondary shrink-0">
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-gold fill-gold" />
                    <span>{teacher.avg_rating?.toFixed(1) || "—"}</span>
                    <span className="text-text-muted">({teacher.review_count})</span>
                  </div>
                  <span>{teacher.total_lessons ?? 0} lessons</span>
                  <span>${teacher.hourly_rate}/hr</span>
                </div>
              </div>

              {/* Profile details */}
              {teacher.headline && (
                <p className="text-sm text-text-secondary">{teacher.headline}</p>
              )}

              {(teacher.categories?.length > 0 || teacher.languages?.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {teacher.categories?.map((c) => (
                    <span key={c} className="px-2 py-0.5 rounded-full text-[10px] bg-gold/10 text-gold">
                      {c}
                    </span>
                  ))}
                  {teacher.languages?.map((l) => (
                    <span key={l} className="px-2 py-0.5 rounded-full text-[10px] bg-accent/10 text-accent">
                      {l}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                {teacher.approval_status === "submitted" && (
                  <TeacherActions teacherId={teacher.id} />
                )}
                <TeacherAdminActions
                  userId={teacher.user_id}
                  approvalStatus={teacher.approval_status}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
