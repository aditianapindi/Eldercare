"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/lib/logo";

export default function JoinPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <JoinInner />
    </Suspense>
  );
}

function Spinner() {
  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-sage border-t-transparent animate-spin" />
    </main>
  );
}

function JoinInner() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, authFetch } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleEmailAuth = async () => {
    if (!email.trim() || !password) {
      setAuthError("Email and password required.");
      return;
    }
    if (password.length < 6) {
      setAuthError("Password must be at least 6 characters.");
      return;
    }
    setAuthBusy(true);
    setAuthError(null);

    // Try sign-in first; fall back to sign-up if the account doesn't exist
    const signIn = await signInWithEmail(email.trim(), password);
    if (!signIn.error) {
      setAuthBusy(false);
      return;
    }

    const signUp = await signUpWithEmail(email.trim(), password);
    if (signUp.error) {
      setAuthError(signUp.error.message || "Couldn't create account.");
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
  };

  useEffect(() => {
    if (loading) return;
    if (!token) {
      // Plain sign-in mode: if already authenticated, route to vault
      if (user) router.replace("/vault");
      return;
    }
    if (!user) return; // wait for sign-in
    if (status !== "idle") return;

    const claim = async () => {
      setStatus("claiming");
      try {
        const res = await authFetch("/api/vault/join", {
          method: "POST",
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(
            data.error === "invalid_or_expired" ? "This invite link is no longer valid. Ask for a fresh one."
            : data.error === "cannot_join_own_vault" ? "You can't join your own vault."
            : "Something went wrong. Try again in a moment."
          );
          return;
        }
        setStatus("success");
        setTimeout(() => router.replace("/vault"), 1200);
      } catch {
        setStatus("error");
        setMessage("Couldn't reach the server. Check your connection.");
      }
    };
    claim();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, token]);

  if (loading) return <Spinner />;

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-6">
      <div className="mb-8">
        <Logo size="large" />
      </div>

      <div className="w-full max-w-[420px] bg-surface border border-border-subtle rounded-[18px] p-8 text-center">
        {!user ? (
          <>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-medium text-ink mb-2">
              {token ? "You've been invited" : "Sign in"}
            </h1>
            <p className="text-ink-secondary text-sm mb-6">
              {token
                ? "Someone shared their family vault with you. Sign in to accept."
                : "Welcome back to Inaya."}
            </p>
            <button
              onClick={() => {
                if (token) sessionStorage.setItem("vault_join_token", token);
                signInWithGoogle();
              }}
              className="w-full min-h-[48px] px-5 py-3 bg-ink text-cream font-medium rounded-[10px] text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-3"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {!showEmail ? (
              <button
                onClick={() => setShowEmail(true)}
                className="w-full text-ink-tertiary text-xs font-medium hover:text-ink transition-colors"
              >
                Or sign in with email
              </button>
            ) : (
              <div className="mt-2 text-left">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  autoComplete="email"
                  className="w-full px-3 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px] mb-2"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 chars)"
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px] mb-3"
                />
                {authError && (
                  <p className="text-terracotta text-xs mb-2">{authError}</p>
                )}
                <button
                  onClick={handleEmailAuth}
                  disabled={authBusy}
                  className="w-full min-h-[44px] px-5 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {authBusy ? "Signing in…" : "Sign in / Sign up"}
                </button>
                <p className="text-ink-tertiary text-[11px] text-center mt-2">
                  New email? We&apos;ll create an account automatically.
                </p>
              </div>
            )}
          </>
        ) : status === "claiming" ? (
          <>
            <div className="w-10 h-10 rounded-full border-4 border-sage border-t-transparent animate-spin mx-auto mb-4" />
            <p className="text-ink-secondary text-sm">Joining vault…</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 13L9 17L19 7" stroke="#7A8B6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-ink mb-2">
              You&apos;re in
            </h1>
            <p className="text-ink-secondary text-sm">Taking you to the vault…</p>
          </>
        ) : status === "error" ? (
          <>
            <div className="w-12 h-12 rounded-full bg-terracotta-light flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 8V12M12 16H12.01" stroke="#B8643F" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="10" stroke="#B8643F" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-medium text-ink mb-2">
              Couldn&apos;t join
            </h1>
            <p className="text-ink-secondary text-sm mb-6">{message}</p>
            <Link href="/" className="text-sage text-sm font-medium underline">Go home</Link>
          </>
        ) : null}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M16.51 8.18C16.51 7.62 16.46 7.08 16.37 6.55H9V9.65H13.22C13.03 10.63 12.47 11.46 11.63 12.02V14.02H14.22C15.74 12.62 16.51 10.59 16.51 8.18Z" fill="#4285F4"/>
      <path d="M9 16.5C11.11 16.5 12.88 15.81 14.22 14.02L11.63 12.02C10.92 12.5 10.04 12.8 9 12.8C6.96 12.8 5.24 11.44 4.62 9.6H1.96V11.65C3.29 14.5 6.02 16.5 9 16.5Z" fill="#34A853"/>
      <path d="M4.62 9.6C4.46 9.12 4.37 8.62 4.37 8.1C4.37 7.58 4.46 7.08 4.62 6.6V4.55H1.96C1.42 5.6 1.1 6.81 1.1 8.1C1.1 9.39 1.42 10.6 1.96 11.65L4.62 9.6Z" fill="#FBBC05"/>
      <path d="M9 3.4C10.14 3.4 11.16 3.79 11.97 4.56L14.28 2.25C12.88 0.94 11.11 0.1 9 0.1C6.02 0.1 3.29 2.1 1.96 4.95L4.62 7C5.24 5.16 6.96 3.4 9 3.4Z" fill="#EA4335"/>
    </svg>
  );
}
