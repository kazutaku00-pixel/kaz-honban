"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function BackButton({ fallbackHref }: { fallbackHref: string }) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
    >
      <ArrowLeft size={15} />
      Back
    </button>
  );
}
