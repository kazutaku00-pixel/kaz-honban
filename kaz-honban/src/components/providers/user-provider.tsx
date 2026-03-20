"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, UserRole } from "@/types/database";

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  roles: UserRole[];
  loading: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  refresh: async () => {},
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      setProfile(null);
      setRoles([]);
      setLoading(false);
      return;
    }

    setUser(user);

    // Fetch profile
    const { data: profileData } = (await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()) as unknown as { data: Profile | null };

    if (profileData) {
      setProfile(profileData);
    }

    // Fetch roles
    const { data: rolesData } = (await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)) as unknown as {
      data: { role: UserRole }[] | null;
    };

    if (rolesData) {
      setRoles(rolesData.map((r) => r.role));
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();

    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData();
      } else {
        setUser(null);
        setProfile(null);
        setRoles([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider
      value={{ user, profile, roles, loading, refresh: fetchUserData }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
