"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowLeft, Chrome } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-mesh px-5 py-12">
      {/* Back link */}
      <Link
        href="/"
        className="fixed top-6 left-6 flex items-center gap-2 text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        <ArrowLeft size={16} />
        Back
      </Link>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold font-[family-name:var(--font-display)] tracking-tight text-text-primary">
            Nihon<span className="text-accent">Go</span>
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create your free account and start learning Japanese
          </p>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary rounded-2xl border border-border p-8">
          {/* Google OAuth — main */}
          <button
            className={cn(
              "flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-sm font-semibold",
              "bg-white text-gray-900 hover:bg-gray-100 transition-all",
              "shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            )}
          >
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Apple Sign-In */}
          <button
            className={cn(
              "flex items-center justify-center gap-3 w-full py-3.5 rounded-xl text-sm font-semibold mt-3",
              "bg-white/5 text-text-primary border border-border",
              "hover:bg-white/10 hover:border-border-hover transition-all"
            )}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm",
                  "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
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
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm",
                  "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
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
                className={cn(
                  "w-full px-4 py-3 rounded-xl text-sm",
                  "bg-bg-primary border border-border text-text-primary placeholder:text-text-muted",
                  "focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20",
                  "transition-all"
                )}
              />
            </div>

            <button
              className={cn(
                "w-full py-3.5 rounded-xl text-sm font-semibold",
                "bg-accent text-white hover:bg-accent-hover transition-all",
                "shadow-[0_0_20px_rgba(255,107,74,0.3)]",
                "hover:shadow-[0_0_30px_rgba(255,107,74,0.5)]"
              )}
            >
              Create Account
            </button>
          </div>

          {/* Role selection hint */}
          <p className="mt-5 text-center text-xs text-text-muted leading-relaxed">
            After sign up, you&apos;ll choose your role:
            <br />
            <span className="text-text-secondary">Learner</span> or{" "}
            <span className="text-text-secondary">Teacher</span>
          </p>
        </div>

        {/* Login link */}
        <p className="mt-6 text-center text-sm text-text-muted">
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
    </div>
  );
}
