"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

interface TeacherActionsProps {
  teacherId: string;
}

export function TeacherActions({ teacherId }: TeacherActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    if (!confirmApprove) {
      setConfirmApprove(true);
      return;
    }

    setError(null);
    const res = await fetch(`/api/admin/teachers/${teacherId}/approve`, {
      method: "PATCH",
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to approve");
      setConfirmApprove(false);
      return;
    }

    setConfirmApprove(false);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleReject() {
    if (!rejectReason.trim()) return;

    setError(null);
    const res = await fetch(`/api/admin/teachers/${teacherId}/reject`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to reject");
      return;
    }

    setShowRejectDialog(false);
    setRejectReason("");
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}

      {!showRejectDialog && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              confirmApprove
                ? "bg-green-500 text-white"
                : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
            )}
          >
            {isPending ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Check size={12} />
            )}
            {confirmApprove ? "Confirm?" : "Approve"}
          </button>

          {confirmApprove ? (
            <button
              onClick={() => setConfirmApprove(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-text-secondary hover:bg-white/20"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setShowRejectDialog(true)}
              disabled={isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X size={12} />
              Reject
            </button>
          )}
        </div>
      )}

      {showRejectDialog && (
        <div className="bg-bg-tertiary rounded-xl border border-border p-3 space-y-2">
          <label className="text-xs text-text-muted font-medium">
            Rejection Reason
          </label>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Provide a reason for rejection..."
            rows={3}
            className="w-full bg-bg-primary border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleReject}
              disabled={isPending || !rejectReason.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isPending ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Confirm Reject
            </button>
            <button
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-text-secondary hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
