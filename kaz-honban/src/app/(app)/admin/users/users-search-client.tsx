"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserActiveToggle } from "@/components/admin/user-active-toggle";
import { UserRoleManager } from "@/components/admin/user-role-manager";

interface UserItem {
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
  hasTeacherProfile: boolean;
  teacherApprovalStatus: string | null;
}

interface UsersSearchClientProps {
  users: UserItem[];
}

type RoleFilter = "all" | "admin" | "teacher" | "learner";

export function UsersSearchClient({ users }: UsersSearchClientProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filtered = users.filter((user) => {
    const matchesSearch =
      !search ||
      user.display_name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all" || user.roles.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-4">
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50 transition"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "admin", "teacher", "learner"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-medium transition",
                roleFilter === f
                  ? "bg-accent text-white"
                  : "bg-white/5 text-text-muted hover:bg-white/10"
              )}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-text-muted">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* User cards */}
      <div className="space-y-3">
        {filtered.map((user) => (
          <div
            key={user.id}
            className="bg-bg-secondary rounded-xl border border-border p-4 space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-semibold flex-shrink-0">
                    {user.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-medium text-text-primary truncate">
                    {user.display_name}
                  </div>
                  <div className="text-xs text-text-muted truncate">
                    {user.email}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-text-muted hidden sm:block">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
                <UserActiveToggle
                  userId={user.id}
                  isActive={user.is_active}
                />
              </div>
            </div>

            {/* Role management */}
            <UserRoleManager
              userId={user.id}
              displayName={user.display_name}
              roles={user.roles}
              hasTeacherProfile={user.hasTeacherProfile}
              teacherApprovalStatus={user.teacherApprovalStatus}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
