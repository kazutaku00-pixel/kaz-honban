import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// When NEXT_PUBLIC_TAB_ISOLATED_AUTH=true, each browser tab keeps its own
// session via sessionStorage instead of sharing via cookies+BroadcastChannel.
// Useful for QA testing with multiple accounts in different tabs.
const useTabIsolation =
  process.env.NEXT_PUBLIC_TAB_ISOLATED_AUTH === "true" &&
  typeof window !== "undefined";

const tabIsolatedStorage: Storage | undefined = useTabIsolation
  ? {
      getItem: (key: string) => sessionStorage.getItem(key),
      setItem: (key: string, value: string) =>
        sessionStorage.setItem(key, value),
      removeItem: (key: string) => sessionStorage.removeItem(key),
      get length() {
        return sessionStorage.length;
      },
      clear: () => sessionStorage.clear(),
      key: (index: number) => sessionStorage.key(index),
    }
  : undefined;

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    useTabIsolation
      ? {
          auth: {
            storage: tabIsolatedStorage,
            storageKey: "sb-auth-token",
            flowType: "pkce",
          },
        }
      : undefined
  );
}
