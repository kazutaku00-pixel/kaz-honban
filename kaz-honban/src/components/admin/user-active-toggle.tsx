"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface UserActiveToggleProps {
  userId: string;
  isActive: boolean;
}

export function UserActiveToggle({ userId, isActive }: UserActiveToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState(isActive);

  async function handleToggle() {
    const newActive = !active;
    setActive(newActive);

    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isActive: newActive }),
    });

    if (!res.ok) {
      setActive(!newActive); // revert
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50",
        active ? "bg-green-500" : "bg-white/20"
      )}
      title={active ? "Active" : "Inactive"}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
          active ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}
