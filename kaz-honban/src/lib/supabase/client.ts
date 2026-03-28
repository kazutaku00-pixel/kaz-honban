import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// When NEXT_PUBLIC_TAB_ISOLATED_AUTH=true, use the vanilla supabase-js client
// with sessionStorage so each tab keeps a completely independent session.
// The @supabase/ssr createBrowserClient always syncs via cookies + BroadcastChannel
// which forces all tabs to the same account — unusable for multi-account testing.
const useTabIsolation =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_TAB_ISOLATED_AUTH === "true";

export function createClient() {
  if (useTabIsolation) {
    return createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: sessionStorage,
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          // Prevent cross-tab auth state broadcast
          storageKey: "sb-auth-token",
        },
      }
    );
  }

  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
