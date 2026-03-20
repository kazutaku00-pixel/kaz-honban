import { createServiceRoleClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { UserActiveToggle } from "@/components/admin/user-active-toggle";

export default async function AdminUsersPage() {
  const admin = createServiceRoleClient();

  const { data: usersRaw, error } = await admin
    .from("profiles")
    .select("*, roles:user_roles(role)")
    .order("created_at", { ascending: false });

  const users = usersRaw as unknown as {
    id: string;
    display_name: string;
    email: string;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    roles: { role: string }[];
  }[] | null;

  return (
    <div className="md:ml-56">
      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Users Management
      </h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm mb-4">
          Failed to load users: {error.message}
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block bg-bg-secondary rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wider">
              <th className="text-left px-4 py-3 font-medium">User</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Roles</th>
              <th className="text-left px-4 py-3 font-medium">Created</th>
              <th className="text-center px-4 py-3 font-medium">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users?.map((user) => {
              const roles = (user.roles as unknown as { role: string }[]) || [];
              return (
                <tr key={user.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold flex-shrink-0">
                        {user.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <span className="text-text-primary font-medium">
                        {user.display_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {user.email}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {roles.map((r) => (
                        <span
                          key={r.role}
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                            r.role === "admin"
                              ? "bg-accent/20 text-accent"
                              : r.role === "teacher"
                                ? "bg-gold/20 text-gold"
                                : "bg-white/10 text-text-muted"
                          )}
                        >
                          {r.role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <UserActiveToggle
                      userId={user.id}
                      isActive={user.is_active}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {users?.map((user) => {
          const roles = (user.roles as unknown as { role: string }[]) || [];
          return (
            <div
              key={user.id}
              className="bg-bg-secondary rounded-xl border border-border p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold flex-shrink-0">
                    {user.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-text-primary truncate">
                      {user.display_name}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {user.email}
                    </div>
                  </div>
                </div>
                <UserActiveToggle
                  userId={user.id}
                  isActive={user.is_active}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                {roles.map((r) => (
                  <span
                    key={r.role}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase",
                      r.role === "admin"
                        ? "bg-accent/20 text-accent"
                        : r.role === "teacher"
                          ? "bg-gold/20 text-gold"
                          : "bg-white/10 text-text-muted"
                    )}
                  >
                    {r.role}
                  </span>
                ))}
                <span className="ml-auto text-[10px] text-text-muted">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
