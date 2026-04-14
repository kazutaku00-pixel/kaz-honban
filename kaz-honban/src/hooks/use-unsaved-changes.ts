"use client";

import { useEffect } from "react";

/**
 * Shows browser's native "Leave site?" dialog when the user tries to close/
 * refresh the page while `hasChanges` is true.
 */
export function useUnsavedChanges(hasChanges: boolean) {
  useEffect(() => {
    if (!hasChanges) return;

    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanges]);
}
