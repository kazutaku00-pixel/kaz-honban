"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

export default function RoleSelectPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      }
    >
      <RoleSelectContent />
    </Suspense>
  );
}

function RoleSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // If invite code present, auto-select teacher
    if (inviteCode) {
      setSelected("teacher");
    }

    // Check if user is authenticated
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/login");
        return;
      }
      // Check if user already has a role
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const role = (data[0] as { role: string }).role;
            if (role === "learner") router.push("/teachers");
            else if (role === "teacher") router.push("/teacher/profile");
            else setCheckingAuth(false);
          } else {
            setCheckingAuth(false);
          }
        });
    });
  }, [inviteCode, router]);

  const handleSelect = async (role: UserRole) => {
    setSelected(role);
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to select a role.");
      setLoading(false);
      return;
    }

    // Insert role
    const { error: roleError } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role } as never);

    if (roleError) {
      setError(roleError.message);
      setLoading(false);
      return;
    }

    // Create profile row
    if (role === "learner") {
      const { error: profileError } = await supabase
        .from("learner_profiles")
        .insert({ user_id: user.id } as never);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      router.push("/teachers");
    } else if (role === "teacher") {
      // If invite code, mark it as used
      if (inviteCode) {
        await supabase
          .from("teacher_invites")
          .update({ used_by: user.id, used_at: new Date().toISOString() } as never)
          .eq("invite_code", inviteCode)
          .is("used_by", null);
      }

      const { error: profileError } = await supabase
        .from("teacher_profiles")
        .insert({ user_id: user.id } as never);

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      router.push("/teacher/profile");
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
          Nihon<span className="text-accent">Go</span>
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          How would you like to use NihonGo?
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Learner */}
        <button
          onClick={() => handleSelect("learner")}
          disabled={loading}
          className={cn(
            "flex flex-col items-center gap-4 p-8 rounded-2xl border transition-all",
            "bg-bg-secondary hover:bg-bg-tertiary",
            selected === "learner"
              ? "border-accent shadow-[0_0_30px_rgba(255,107,74,0.2)]"
              : "border-border hover:border-border-hover",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              selected === "learner"
                ? "bg-accent/20 text-accent"
                : "bg-white/5 text-text-secondary"
            )}
          >
            <BookOpen size={28} />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary">
              I want to Learn
            </h2>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Find teachers, book lessons, and master Japanese
            </p>
          </div>
          {loading && selected === "learner" && (
            <Loader2 size={18} className="animate-spin text-accent" />
          )}
        </button>

        {/* Teacher */}
        <button
          onClick={() => handleSelect("teacher")}
          disabled={loading}
          className={cn(
            "flex flex-col items-center gap-4 p-8 rounded-2xl border transition-all",
            "bg-bg-secondary hover:bg-bg-tertiary",
            selected === "teacher"
              ? "border-gold shadow-[0_0_30px_rgba(196,169,98,0.2)]"
              : "border-border hover:border-border-hover",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              selected === "teacher"
                ? "bg-gold/20 text-gold"
                : "bg-white/5 text-text-secondary"
            )}
          >
            <GraduationCap size={28} />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary">
              I want to Teach
            </h2>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">
              Share your expertise and earn by teaching Japanese
            </p>
          </div>
          {loading && selected === "teacher" && (
            <Loader2 size={18} className="animate-spin text-gold" />
          )}
        </button>
      </div>

      {inviteCode && (
        <p className="mt-6 text-center text-xs text-gold/80">
          You were invited as a teacher. Your invite code has been applied.
        </p>
      )}
    </div>
  );
}
