"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

/**
 * Sticky bottom bar for /fraudguard — branches on auth state.
 * Same pattern as /safety's sticky bar, different source param.
 */
export function FraudguardStickyBar() {
  const { user } = useAuth();

  // Default to the anonymous copy during loading so SSR + crawlers see
  // the CTA. Signed-in users briefly see anonymous copy until auth resolves.
  const heading = user
    ? "Back to your family vault."
    : "Set up your family vault in 60 seconds.";
  const subtitle = user
    ? "Health, money and safety essentials, one place."
    : "Track health, money and safety essentials in one place.";
  const href = user ? "/vault" : "/assess?source=fraudguard";
  const buttonLabel = user ? "Go to vault →" : "Get started →";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-cream/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(42,37,32,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="px-4 py-3 md:px-12 md:py-4 flex items-center justify-between gap-3 md:gap-6 max-w-[1100px] mx-auto">
        <div className="min-w-0">
          <p className="text-ink font-medium text-sm md:text-base leading-snug truncate">
            {heading}
          </p>
          <p className="hidden sm:block text-ink-tertiary text-xs md:text-sm">
            {subtitle}
          </p>
        </div>
        <Link
          href={href}
          className="shrink-0 inline-flex items-center justify-center px-5 py-3 md:px-6 md:py-3.5 bg-sage text-white text-sm md:text-base font-medium rounded-[10px] hover:opacity-90 transition-opacity min-h-[44px] md:min-h-[48px]"
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}
