"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  GraduationCap,
  BookOpen,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRoleManagerProps {
  userId: string;
  displayName: string;
  roles: string[];
  hasTeacherProfile: boolean;
  teacherApprovalStatus: string | null;
}

const ROLE_CONFIG = {
  admin: { icon: Shield, color: "bg-accent/20 text-accent", label: "Admin" },
  teacher: { icon: GraduationCap, color: "bg-gold/20 text-gold", label: "Teacher" },
  learner: { icon: BookOpen, color: "bg-white/10 text-text-muted", label: "Learner" },
} as const;

export function UserRoleManager({
  userId,
  displayName,
  roles: initialRoles,
  hasTeacherProfile,
  teacherApprovalStatus,
}: UserRoleManagerProps) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function grantRole(role: string) {
    setLoading(`grant_${role}`);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "grant_role", userId, role }),
    });
    if (res.ok) {
      setRoles([...roles, role]);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(null);
  }

  async function revokeRole(role: string) {
    setLoading(`revoke_${role}`);
    setError(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke_role", userId, role }),
    });
    if (res.ok) {
      setRoles(roles.filter((r) => r !== role));
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error);
    }
    setLoading(null);
  }

  const missingRoles = (["admin", "teacher", "learner"] as const).filter(
    (r) => !roles.includes(r)
  );

  return (
    <div className="space-y-3">
      {/* Current roles */}
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => {
          const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <span
              key={role}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold",
                config.color
              )}
            >
              <Icon size={12} />
              {config.label}
              <button
                onClick={() => revokeRole(role)}
                disabled={loading !== null}
                className="ml-1 hover:opacity-70 disabled:opacity-30"
                title={`Remove ${role} role`}
              >
                {loading === `revoke_${role}` ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <X size={10} />
                )}
              </button>
            </span>
          );
        })}
      </div>

      {/* Add role buttons */}
      {missingRoles.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {missingRoles.map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            return (
              <button
                key={role}
                onClick={() => grantRole(role)}
                disabled={loading !== null}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/5 text-text-muted hover:bg-white/10 border border-dashed border-border transition disabled:opacity-30"
              >
                {loading === `grant_${role}` ? (
                  <Loader2 size={10} className="animate-spin" />
                ) : (
                  <>
                    <Plus size={10} />
                    <Icon size={10} />
                    {config.label}
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
