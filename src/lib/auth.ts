"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase-browser";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = getSupabase();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
      });
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          loading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(() => {
    const supabase = getSupabase();
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  const signUpWithEmail = useCallback(
    (email: string, password: string) => {
      const supabase = getSupabase();
      return supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/vault`,
        },
      });
    },
    []
  );

  const signInWithEmail = useCallback(
    (email: string, password: string) => {
      const supabase = getSupabase();
      return supabase.auth.signInWithPassword({ email, password });
    },
    []
  );

  const signOut = useCallback(() => {
    const supabase = getSupabase();
    return supabase.auth.signOut();
  }, []);

  /** Helper: authenticated fetch with the user's JWT */
  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const supabase = getSupabase();
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) throw new Error("Not authenticated");

      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${currentSession.access_token}`,
          "Content-Type": "application/json",
        },
      });
    },
    []
  );

  return {
    ...state,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    authFetch,
  };
}
