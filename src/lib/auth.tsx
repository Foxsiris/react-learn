import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { hydrateProgressFor } from "../hooks/useProgress";

type AuthState = {
  session: Session | null;
  userId: string | null;
  loading: boolean;
};

const AuthCtx = createContext<AuthState>({ session: null, userId: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, userId: null, loading: true });

  useEffect(() => {
    let mounted = true;
    const apply = (session: Session | null) => {
      if (!mounted) return;
      const userId = session?.user.id ?? null;
      setState({ session, userId, loading: false });
      void hydrateProgressFor(userId);
    };

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session) {
        apply(session);
        return;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!mounted) return;
      if (error || !data.session) {
        console.error("[auth] anonymous sign-in failed:", error);
        setState({ session: null, userId: null, loading: false });
        return;
      }
      apply(data.session);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => apply(session));

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthCtx.Provider value={state}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthCtx);
}

export function useUserId(): string | null {
  return useContext(AuthCtx).userId;
}
