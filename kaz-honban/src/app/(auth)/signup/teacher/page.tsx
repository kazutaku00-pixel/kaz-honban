"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, GraduationCap, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function TeacherSignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gold" />
        </div>
      }
    >
      <TeacherSignupContent />
    </Suspense>
  );
}

function TeacherSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get("invite");

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      const supabase = createClient();
      supabase
        .from("teacher_invites")
        .select("id")
        .eq("invite_code", inviteCode)
        .is("used_by", null)
        .gt("expires_at", new Date().toISOString())
        .single()
        .then(({ data }) => {
          setInviteValid(!!data);
        });
    }
  }, [inviteCode]);

  const assignTeacherRole = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (inviteCode) {
      // Claim the invite first, rejecting the signup if another user already
      // used it. Without this guard, two concurrent signups could both land a
      // teacher role even though only the first actually owns the invite.
      const { data: claimed, error: claimErr } = await supabase
        .from("teacher_invites")
        .update({ used_by: user.id, used_at: new Date().toISOString() } as never)
        .eq("invite_code", inviteCode)
        .is("used_by", null)
        .select("id");

      if (claimErr || !claimed || claimed.length === 0) {
        setError("This invite code has already been used.");
        return;
      }
    }

    await supabase.from("user_roles").insert({ user_id: user.id, role: "teacher" } as never);
    await supabase.from("teacher_profiles").insert({ user_id: user.id } as never);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const callbackUrl = inviteCode
      ? `${window.location.origin}/auth/callback?role=teacher&invite=${inviteCode}`
      : `${window.location.origin}/auth/callback?role=teacher`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          intended_role: "teacher",
          invite_code: inviteCode ?? null,
        },
        emailRedirectTo: callbackUrl,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setConfirmEmailSent(true);
      setLoading(false);
      return;
    }

    await assignTeacherRole();
    router.push("/teacher/profile");
  };

  if (confirmEmailSent) {
    return (
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="fixed top-6 left-6 flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <div className="bg-bg-secondary rounded-2xl border border-border p-8 text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
            <Mail size={32} className="text-gold" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Check your email</h1>
            <p className="mt-2 text-sm text-text-secondary break-all">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your teacher account.
            </p>
          </div>
          <p className="text-xs text-text-muted">
            The invite code stays valid — it will be claimed when you confirm your email.
          </p>
          <Link href="/login" className="inline-block text-sm text-accent hover:underline">
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Back link */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
          Nihon<span className="text-accent">Go</span>
        </h1>
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20">
          <GraduationCap size={14} className="text-gold" />
          <span className="text-xs font-medium text-gold">Teacher Account</span>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Join our team and start teaching Japanese
        </p>
      </div>

      {/* Card */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-8">
        {/* Invite code status */}
        {inviteCode && inviteValid === true && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm text-center">
            Invite code applied
          </div>
        )}
        {inviteCode && inviteValid === false && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            Invalid or expired invite code
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Email form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20",
                "transition-all"
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20",
                "transition-all"
              )}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20",
                "transition-all"
              )}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3.5 rounded-xl text-sm font-semibold",
              "bg-gold text-white hover:bg-gold/90 transition-all",
              "shadow-[0_0_20px_rgba(196,169,98,0.3)]",
              "hover:shadow-[0_0_30px_rgba(196,169,98,0.5)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Start Teaching
          </button>
        </form>
      </div>

      {/* Learner link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Want to learn Japanese?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up as Student
        </Link>
      </p>

      {/* Login link */}
      <p className="mt-3 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Log in
        </Link>
      </p>

      {/* Legal */}
      <p className="mt-4 text-center text-[11px] text-text-muted leading-relaxed">
        By signing up, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-text-secondary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-text-secondary">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
