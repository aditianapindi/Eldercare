import Link from "next/link";

export function PrivacyTrustLine({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-ink-tertiary text-xs ${className}`}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0">
        <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <span>
        Your data never leaves your control. Never sold.{" "}
        <Link href="/privacy" className="text-sage underline underline-offset-2 decoration-sage/40 hover:decoration-sage">
          Delete anytime.
        </Link>
      </span>
    </div>
  );
}
