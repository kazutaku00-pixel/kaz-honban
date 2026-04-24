"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, BookOpen, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LearnerSignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmEmailSent, setConfirmEmailSent] = useState(false);

  const assignLearnerRole = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("user_roles").insert({ user_id: user.id, role: "learner" } as never);
    await supabase.from("learner_profiles").insert({ user_id: user.id } as never);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          intended_role: "learner",
        },
        // If Supabase has email confirmation on, the user clicks the link in
        // their inbox and lands here — the role param lets /auth/callback
        // provision the learner profile correctly.
        emailRedirectTo: `${window.location.origin}/auth/callback?role=learner`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If Supabase requires email confirmation, data.session is null. Show a
    // "check your inbox" state instead of pushing into a protected route
    // where middleware would bounce the user back to /login.
    if (!data.session) {
      setConfirmEmailSent(true);
      setLoading(false);
      return;
    }

    try {
      await assignLearnerRole();
    } catch {
      setError("Account created but profile setup failed. Please log in and try again.");
      setLoading(false);
      return;
    }
    router.push("/teachers");
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
          <div className="mx-auto w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Mail size={32} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">Check your email</h1>
            <p className="mt-2 text-sm text-text-secondary break-all">
              We sent a confirmation link to <strong>{email}</strong>. Click it to finish creating your account.
            </p>
          </div>
          <p className="text-xs text-text-muted">
            No email after a minute? Check your spam folder.
          </p>
          <Link
            href="/login"
            className="inline-block text-sm text-accent hover:underline"
          >
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
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20">
          <BookOpen size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent">Student Account</span>
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Create your free account and start learning Japanese
        </p>
      </div>

      {/* Card */}
      <div className="bg-bg-secondary rounded-2xl border border-border p-8">
        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Email form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div>
            <label htmlFor="signup-display-name" className="block text-xs font-medium text-text-secondary mb-1.5">
              Display Name
            </label>
            <input
              id="signup-display-name"
              name="displayName"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
                "transition-all"
              )}
            />
          </div>
          <div>
            <label htmlFor="signup-email" className="block text-xs font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
                "transition-all"
              )}
            />
          </div>
          <div>
            <label htmlFor="signup-password" className="block text-xs font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              aria-describedby="signup-password-help"
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
                "transition-all"
              )}
            />
            <p id="signup-password-help" className="mt-1.5 text-[11px] text-text-muted">
              Use at least 8 characters. Mix letters and numbers for a stronger password.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full py-3.5 rounded-xl text-sm font-semibold",
              "bg-accent text-white hover:bg-accent-hover transition-all",
              "shadow-[0_0_20px_rgba(255,107,74,0.3)]",
              "hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "flex items-center justify-center gap-2"
            )}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Start Learning
          </button>
        </form>
      </div>

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
