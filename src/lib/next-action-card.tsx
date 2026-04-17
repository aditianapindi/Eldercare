"use client";

import Link from "next/link";
import { getNextStep } from "@/lib/care-plan-steps";

/**
 * Shows a "next step" nudge after saving an item during the care-plan flow.
 * Only renders when `?from=care-plan` is in the URL.
 */
export function NextActionCard({ currentKey }: { currentKey: string }) {
  // Safe to read window here — this component only mounts after a save (fully hydrated)
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get("from") !== "care-plan") return null;

  const next = getNextStep(currentKey);

  return (
    <div className="mt-6 bg-sage-light/50 border border-sage/20 rounded-[12px] p-4 animate-[fadeIn_0.3s_ease]">
      {next ? (
        <Link
          href={`${next.href}?from=care-plan`}
          className="flex items-center justify-between"
        >
          <p className="text-sage text-sm font-medium">{next.nextHint}</p>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sage shrink-0 ml-2">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      ) : (
        <Link href="/vault" className="flex items-center justify-between">
          <p className="text-sage text-sm font-medium">You&apos;re all set! Head back to your care plan</p>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sage shrink-0 ml-2">
            <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}
