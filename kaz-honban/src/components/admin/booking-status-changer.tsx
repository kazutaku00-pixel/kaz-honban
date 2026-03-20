"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { BookingStatus } from "@/types/database";

const ALL_STATUSES: BookingStatus[] = [
  "confirmed",
  "in_session",
  "completed",
  "cancelled",
  "no_show",
];

interface BookingStatusChangerProps {
  bookingId: string;
  currentStatus: BookingStatus;
}

export function BookingStatusChanger({
  bookingId,
  currentStatus,
}: BookingStatusChangerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(currentStatus);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as BookingStatus;
    if (newStatus === selected) return;

    const prev = selected;
    setSelected(newStatus);
    setError(null);

    const res = await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, status: newStatus }),
    });

    if (!res.ok) {
      setSelected(prev);
      setError("Failed to update status");
      setTimeout(() => setError(null), 3000);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-1">
      <select
        value={selected}
        onChange={handleChange}
        disabled={isPending}
        className="bg-bg-tertiary border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      >
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      {isPending && <Loader2 size={12} className="animate-spin text-text-muted" />}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
