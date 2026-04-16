"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

type DownloadState = "idle" | "form" | "loading" | "success" | "error";

interface SaayaDownloadProps {
  source: string; // 'homepage', 'saaya-page', 'safety-page', 'report'
  variant?: "default" | "compact"; // compact for inline placements
}

export function SaayaDownload({ source, variant = "default" }: SaayaDownloadProps) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DownloadState>("idle");
  const [email, setEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDownload = async () => {
    if (!email.trim()) return;

    setState("loading");
    setErrorMsg("");

    try {
      const sessionId = typeof window !== "undefined"
        ? sessionStorage.getItem("pv_sid") || "unknown"
        : "unknown";

      const res = await fetch("/api/download/saaya", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          session_id: sessionId,
          source,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "invalid_email") {
          setErrorMsg("Please enter a valid email address.");
        } else if (data.error === "rate_limited") {
          setErrorMsg("Too many requests. Please try again later.");
        } else {
          setErrorMsg("Something went wrong. Please try again.");
        }
        setState("form");
        return;
      }

      const { url } = await res.json();

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "saaya.apk";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setState("success");
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setState("form");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleDownload();
  };

  // Idle state — show the download button
  if (state === "idle") {
    return (
      <button
        onClick={() => setState("form")}
        className={`inline-flex items-center gap-2 font-medium rounded-[10px] hover:opacity-90 transition-opacity ${
          variant === "compact"
            ? "px-4 py-2.5 text-sm bg-terracotta text-white min-h-[44px]"
            : "px-6 py-3.5 text-base bg-terracotta text-white min-h-[52px]"
        }`}
        aria-label="Download Saaya APK"
      >
        <DownloadIcon />
        Download Saaya
      </button>
    );
  }

  // Form state — email input
  if (state === "form" || state === "loading") {
    return (
      <div className={`${variant === "compact" ? "space-y-2" : "space-y-3"}`}>
        <p className="text-sm text-ink-secondary">
          Enter your email to get the download + setup instructions.
        </p>
        <div className="flex items-stretch gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="email"
            aria-label="Email address for Saaya download"
            className="flex-1 px-3 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px] min-w-0"
          />
          <button
            onClick={handleDownload}
            disabled={state === "loading" || !email.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-terracotta text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {state === "loading" ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <DownloadIcon />
                Download
              </>
            )}
          </button>
        </div>
        {errorMsg && (
          <p className="text-xs text-terracotta">{errorMsg}</p>
        )}
        <button
          onClick={() => { setState("idle"); setEmail(""); setErrorMsg(""); }}
          className="text-xs text-ink-tertiary hover:text-ink transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  // Success state — post-download card
  if (state === "success") {
    return (
      <div className="bg-sage/10 border border-sage/20 rounded-[12px] p-4 space-y-3" role="status" aria-live="polite">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage shrink-0">
            <path d="M4 10L8 14L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm font-medium text-ink">Download started</p>
        </div>
        {!authLoading && user ? (
          // Logged-in user
          <div>
            <p className="text-sm text-ink-secondary mb-3">
              Install the APK on your parent&apos;s phone, then generate a passport code to link it.
            </p>
            <Link
              href="/vault/saaya"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity"
            >
              Generate passport code →
            </Link>
          </div>
        ) : (
          // Anonymous user
          <div>
            <p className="text-sm text-ink-secondary mb-3">
              Install the APK on your parent&apos;s phone, then create an Inaya account to link it and see fraud alerts.
            </p>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity"
            >
              Create account to link Saaya →
            </Link>
          </div>
        )}
      </div>
    );
  }

  return null;
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2V10M8 10L5 7M8 10L11 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
