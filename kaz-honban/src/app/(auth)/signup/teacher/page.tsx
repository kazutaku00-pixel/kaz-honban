"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, GraduationCap, Loader2 } from "lucide-react";
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
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);

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

    await supabase.from("user_roles").insert({ user_id: user.id, role: "teacher" } as never);
    await supabase.from("teacher_profiles").insert({ user_id: user.id } as never);

    if (inviteCode) {
      await supabase
        .from("teacher_invites")
        .update({ used_by: user.id, used_at: new Date().toISOString() } as never)
        .eq("invite_code", inviteCode)
        .is("used_by", null);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setOauthLoading("google");
    const supabase = createClient();
    const callbackUrl = inviteCode
      ? `${window.location.origin}/auth/callback?role=teacher&invite=${inviteCode}`
      : `${window.location.origin}/auth/callback?role=teacher`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  const handleAppleSignup = async () => {
    setError(null);
    setOauthLoading("apple");
    const supabase = createClient();
    const callbackUrl = inviteCode
      ? `${window.location.origin}/auth/callback?role=teacher&invite=${inviteCode}`
      : `${window.location.origin}/auth/callback?role=teacher`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setError(error.message);
      setOauthLoading(null);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await assignTeacherRole();
    router.push("/teacher/profile");
  };

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

        {/* Google OAuth */}
        <button
          onClick={handleGoogleSignup}
          disabled={!!oauthLoading}
          className={cn(
            "flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-sm font-semibold",
            "bg-white text-gray-900 hover:bg-gray-100 transition-all",
            "shadow-[0_0_20px_rgba(255,255,255,0.05)]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {oauthLoading === "google" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          Continue with Google
        </button>

        {/* Apple Sign-In */}
        <button
          onClick={handleAppleSignup}
          disabled={!!oauthLoading}
          className={cn(
            "flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-sm font-semibold mt-3",
            "bg-white/5 text-text-primary border border-border",
            "hover:bg-white/10 hover:border-border-hover transition-all",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {oauthLoading === "apple" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
          Continue with Apple
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-text-muted">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

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
