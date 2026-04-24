"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/support";

export default function RoomError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Room error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle size={32} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">
            The video room hit an error
          </h2>
          <p className="text-sm text-text-muted mt-2">
            Refresh to try again. If you still can&apos;t join, your lesson
            partner can also start the room.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition min-h-12"
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <Link
            href="/bookings"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border text-text-primary text-sm hover:bg-surface transition min-h-12"
          >
            Back to bookings
          </Link>
        </div>
        <p className="text-xs text-text-muted">
          Still stuck?{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="underline hover:text-text-primary"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
