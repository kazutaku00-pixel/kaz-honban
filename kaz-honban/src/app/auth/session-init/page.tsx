"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Tab-isolated auth session initializer.
 * Receives access_token + refresh_token via URL hash fragment (never sent to server),
 * sets the session in the client's sessionStorage, then redirects.
 */
export default function SessionInitPage() {
  const router = useRouter();

  useEffect(() => {
    async function initSession() {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const redirect = params.get("redirect") || "/dashboard";

      if (!accessToken || !refreshToken) {
        router.replace("/login?error=session");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Failed to set session:", error);
        router.replace("/login?error=session");
        return;
      }

      // Clear hash from URL and redirect
      window.location.hash = "";
      router.replace(redirect);
    }

    initSession();
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-text-secondary text-sm">Signing in...</p>
      </div>
    </div>
  );
}
