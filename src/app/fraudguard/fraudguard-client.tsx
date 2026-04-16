"use client";

import { SaayaDownload } from "@/lib/saaya-download";

/**
 * Sticky bottom bar for /fraudguard (Saaya page) — download CTA always visible.
 */
export function FraudguardStickyBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 bg-cream/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_rgba(42,37,32,0.06)] pb-[env(safe-area-inset-bottom)]">
      <div className="px-4 py-3 md:px-12 md:py-4 flex items-center justify-between gap-3 md:gap-6 max-w-[1100px] mx-auto">
        <div className="min-w-0">
          <p className="text-ink font-medium text-sm md:text-base leading-snug truncate">
            Protect your parents from scam calls.
          </p>
          <p className="hidden sm:block text-ink-tertiary text-xs md:text-sm">
            Free · Open source · Android 8.0+
          </p>
        </div>
        <div className="shrink-0">
          <SaayaDownload source="saaya-page-sticky" variant="compact" />
        </div>
      </div>
    </div>
  );
}
