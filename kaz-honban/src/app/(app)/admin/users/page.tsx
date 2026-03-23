import { createServiceRoleClient } from "@/lib/supabase/server";
import { UserActiveToggle } from "@/components/admin/user-active-toggle";
import { UserRoleManager } from "@/components/admin/user-role-manager";
import { UsersSearchClient } from "./users-search-client";

export default async function AdminUsersPage() {
  const admin = createServiceRoleClient();

  const { data: usersRaw, error } = await admin
    .from("profiles")
    .select("*, roles:user_roles(role)")
    .order("created_at", { ascending: false });

  // Also fetch teacher profiles for suspension status
  const { data: teacherProfilesRaw } = await admin
    .from("teacher_profiles")
    .select("user_id, approval_status");

  const teacherMap = new Map(
    ((teacherProfilesRaw ?? []) as unknown as { user_id: string; approval_status: string }[]).map(
      (tp) => [tp.user_id, tp.approval_status]
    )
  );

  const users = (usersRaw ?? []) as unknown as {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    roles: { role: string }[];
  }[];

  return (
    <div className="md:ml-56">
      <h1 className="text-2xl font-bold text-text-primary mb-6 font-[family-name:var(--font-display)]">
        Users Management
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
          Failed to load users: {error.message}
        </div>
      )}

      <UsersSearchClient
        users={users.map((user) => {
          const roles = (user.roles ?? []).map((r) => r.role);
          const hasTeacher = roles.includes("teacher");
          return {
            id: user.id,
            display_name: user.display_name,
            email: user.email,
            avatar_url: user.avatar_url,
            is_active: user.is_active,
            created_at: user.created_at,
            roles,
            hasTeacherProfile: hasTeacher,
            teacherApprovalStatus: teacherMap.get(user.id) ?? null,
          };
        })}
      />
    </div>
  );
}
