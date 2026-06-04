import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/data/supabase";
import { getProfile } from "@/domain/services/profile";
import type { ProfileType } from "@/domain/types";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: ProfileType | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadProfile(userId: string) {
    try {
      const p = await getProfile(userId);
      setProfile(p);
    } catch {
      // profile load failure is non-fatal
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      else setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id);
      else { setProfile(null); setIsLoading(false); }
    });

    return () => listener.subscription.unsubscribe();
   
  }, []);

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      isLoading,
      isAdmin: profile?.role === "admin",
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
