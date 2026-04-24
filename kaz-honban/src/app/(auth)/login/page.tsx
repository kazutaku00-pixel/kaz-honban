"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectByRole = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (roles && roles.length > 0) {
      const role = (roles[0] as { role: string }).role;
      if (redirectTo) {
        router.push(redirectTo);
      } else if (role === "teacher") {
        router.push("/teacher/dashboard");
      } else {
        router.push("/dashboard");
      }
    } else {
      router.push("/role-select");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    await redirectByRole();
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
        <p className="mt-2 text-sm text-text-secondary">
          Welcome back! Log in to continue your journey
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
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-medium text-text-secondary mb-1.5">
              Email
            </label>
            <input
              id="login-email"
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
            <label htmlFor="login-password" className="block text-xs font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={cn(
                "w-full px-4 py-3 rounded-xl text-sm",
                "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
                "transition-all"
              )}
            />
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
            Log in
          </button>
        </form>
      </div>

      {/* Signup link */}
      <p className="mt-6 text-center text-sm text-text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-accent hover:underline font-medium">
          Sign up free
        </Link>
      </p>

      {/* Legal */}
      <p className="mt-4 text-center text-[11px] text-text-muted leading-relaxed">
        By logging in, you agree to our{" "}
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
