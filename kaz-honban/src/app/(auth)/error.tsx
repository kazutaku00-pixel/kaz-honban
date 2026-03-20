"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Auth error:", error);
  }, [error]);

  return (
    <div className="w-full max-w-md text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertTriangle size={32} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-text-primary">Authentication Error</h2>
        <p className="text-sm text-text-muted mt-2">
          Something went wrong during authentication. Please try again.
        </p>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center px-5 py-3 rounded-xl border border-border text-text-secondary font-medium text-sm hover:bg-white/5 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
