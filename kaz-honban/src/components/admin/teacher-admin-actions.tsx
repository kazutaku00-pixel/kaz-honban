"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

interface TeacherAdminActionsProps {
  userId: string;
  approvalStatus: string;
}

export function TeacherAdminActions({ userId, approvalStatus }: TeacherAdminActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, userId }),
    });
    router.refresh();
    setLoading(null);
  }

  if (approvalStatus === "approved") {
    return (
      <button
        onClick={() => handleAction("suspend_teacher")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-30"
      >
        {loading === "suspend_teacher" ? <Loader2 size={12} className="animate-spin" /> : <Ban size={12} />}
        Suspend
      </button>
    );
  }

  if (approvalStatus === "suspended") {
    return (
      <button
        onClick={() => handleAction("reactivate_teacher")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-30"
      >
        {loading === "reactivate_teacher" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Reactivate
      </button>
    );
  }

  if (approvalStatus === "rejected") {
    return (
      <button
        onClick={() => handleAction("reactivate_teacher")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 hover:bg-green-500/20 transition disabled:opacity-30"
      >
        {loading === "reactivate_teacher" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
        Re-approve
      </button>
    );
  }

  return null;
}
