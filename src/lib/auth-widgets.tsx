"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Logo } from "@/lib/logo";

/**
 * Small top-right header link that adapts to auth state.
 * Anonymous: "Sign in" → /join (no token = plain login mode)
 * Authenticated: "Back to vault →" → /vault
 * Loading: renders a width-matched placeholder to avoid layout shift
 */
export function AuthHeaderLink({ className = "" }: { className?: string }) {
  const { user } = useAuth();

  // Default to the anonymous "Sign in" link during loading so SSR renders
  // real content (for LinkedIn crawlers) and there's no flash-of-missing-link.
  // Signed-in users briefly see "Sign in" until auth resolves — then it
  // switches to "Back to vault →".
  if (user) {
    return (
      <Link
        href="/vault"
        className={`text-ink-tertiary text-sm hover:text-ink transition-colors ${className}`}
      >
        Back to vault →
      </Link>
    );
  }

  return (
    <Link
      href="/join"
      className={`text-ink-tertiary text-sm hover:text-ink transition-colors ${className}`}
    >
      Sign in
    </Link>
  );
}

/**
 * Logo wrapped in an auth-aware Link.
 * Anonymous: links to /
 * Authenticated: links to /vault
 */
export function LogoWithAuthLink({
  size = "default",
}: {
  size?: "small" | "default" | "large";
}) {
  const { user } = useAuth();
  const href = user ? "/vault" : "/";
  return (
    <Link href={href} className="inline-block hover:opacity-80 transition-opacity">
      <Logo size={size} />
    </Link>
  );
}
