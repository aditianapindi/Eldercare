"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code received.");
      return;
    }

    const supabase = getSupabase();
    supabase.auth.exchangeCodeForSession(code).then(({ error: authError }) => {
      if (authError) {
        setError(authError.message);
        return;
      }
      router.replace("/vault?setup=true");
    });
  }, [searchParams, router]);

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
