"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-dvh flex items-center justify-center px-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full border-4 border-sage border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-ink-secondary text-lg">Signing you in...</p>
          </div>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}

function AuthCallbackInner() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    let handled = false;

    const handleSession = (redirectTo: string) => {
      if (handled) return;
      handled = true;
      router.replace(redirectTo);
    };

    // First, check if a session already exists (from URL hash detection)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleSession("/vault?setup=true");
        return;
      }

      // Try PKCE code exchange (if code is in query params)
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        supabase.auth.exchangeCodeForSession(code).then(({ data, error: authError }) => {
          if (data?.session) {
            handleSession("/vault?setup=true");
          } else if (authError) {
            setError(authError.message);
          }
        });
        return;
      }

      // No code and no session — wait briefly for onAuthStateChange (implicit flow detection)
      const timeout = setTimeout(() => {
        if (!handled) {
          setError("Sign-in didn't complete. Please try again.");
        }
      }, 3000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          clearTimeout(timeout);
          handleSession("/vault?setup=true");
        }
      });

      return () => {
        clearTimeout(timeout);
        subscription.unsubscribe();
      };
    });
  }, [router]);

  if (error) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-[400px]">
          <p className="text-ink text-lg font-medium mb-2">Sign-in failed</p>
          <p className="text-ink-secondary mb-6">{error}</p>
          <a href="/assess" className="text-sage underline text-lg">
            Try again
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 border-sage border-t-transparent animate-spin mx-auto mb-4" />
        <p className="text-ink-secondary text-lg">Signing you in...</p>
      </div>
    </main>
  );
}
