"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [dismissed, setDismissed] = useState(false);

  // Hide on vault pages (authed product) and admin
  const hidden = pathname.startsWith("/vault") || pathname.startsWith("/admin") || pathname.startsWith("/auth");

  // Reset when navigating to a new page
  useEffect(() => {
    if (status === "done") {
      setOpen(false);
      setScore(null);
      setComment("");
      setStatus("idle");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (hidden || dismissed) return null;

  // Thank-you state after submit
  if (status === "done") {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border-subtle rounded-[16px] shadow-lg p-5 w-[320px] animate-[fadeIn_0.2s_ease]">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 13L9 17L19 7" stroke="#7A8B6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-ink font-medium text-sm mb-1">Thank you!</p>
          <p className="text-ink-tertiary text-xs">Your feedback helps us improve.</p>
        </div>
      </div>
    );
  }

  // Collapsed: floating button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] bg-ink text-cream text-sm font-medium rounded-full shadow-lg hover:opacity-90 transition-opacity"
        aria-label="Send feedback"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
          <path d="M2 2.5h12A1.5 1.5 0 0 1 15.5 4v6a1.5 1.5 0 0 1-1.5 1.5H5L2 14V4A1.5 1.5 0 0 1 3.5 2.5H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
          <path d="M5 6h6M5 8.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Feedback
      </button>
    );
  }

  // Expanded: NPS + comment form
  const handleSubmit = async () => {
    if (score === null) return;
    setStatus("sending");

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment, page: pathname }),
      });
    } catch {
      // Silently fail — don't block the user
    }

    setStatus("done");
    // Auto-dismiss after 2s
    setTimeout(() => setDismissed(true), 2000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-surface border border-border-subtle rounded-[16px] shadow-lg w-[320px] animate-[fadeIn_0.2s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <p className="text-ink font-medium text-sm">How likely are you to recommend Inaya?</p>
        <button
          onClick={() => setOpen(false)}
          className="text-ink-tertiary hover:text-ink transition-colors p-1 -mr-1"
          aria-label="Close"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="px-5 pb-5">
        {/* NPS score row */}
        <div className="mb-1">
          <div className="flex gap-[3px]">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setScore(i)}
                className={`flex-1 h-8 rounded-md text-xs font-medium transition-colors ${
                  score === i
                    ? i <= 6
                      ? "bg-terracotta text-white"
                      : i <= 8
                        ? "bg-mustard text-white"
                        : "bg-sage text-white"
                    : "bg-sand text-ink-secondary hover:bg-sage-light/60"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-ink-tertiary">Not at all</span>
            <span className="text-[10px] text-ink-tertiary">Absolutely!</span>
          </div>
        </div>

        {/* Comment — appears after score selection */}
        {score !== null && (
          <div className="mt-3 animate-[fadeIn_0.2s_ease]">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={score >= 7 ? "What do you like most?" : "What could we do better?"}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-[10px] text-ink text-sm resize-none focus:border-sage focus:outline-none placeholder:text-ink-tertiary/60"
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={status === "sending"}
              className="w-full mt-2 px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[40px] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {status === "sending" ? "Sending..." : "Send feedback"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
