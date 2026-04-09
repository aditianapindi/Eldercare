"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { CareReport } from "@/lib/types";
import { getScoreLabel, getScoreSubtext } from "@/lib/scoring";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<CareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      // Try sessionStorage first (most reliable — survives HMR and server restarts)
      if (typeof window !== "undefined") {
        const storedReport = sessionStorage.getItem(`report-${id}`);
        if (storedReport) {
          setReport(JSON.parse(storedReport));
          setLoading(false);
          return;
        }

        const storedAssessment = sessionStorage.getItem(`assessment-${id}`);
        if (storedAssessment) {
          setReport(generateClientReport(JSON.parse(storedAssessment), id));
          setLoading(false);
          return;
        }
      }

      // Fallback: try server API
      try {
        const res = await fetch(`/api/generate-report?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setReport(data.report);
          setLoading(false);
          return;
        }
      } catch {
        // Fall through to error
      }

      setError("Report not found. It may have expired — try taking the assessment again.");
      setLoading(false);
    }

    loadReport();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-sage border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-ink-secondary text-lg">Putting together your family&apos;s care plan...</p>
        </div>
      </main>
    );
  }

  if (error || !report) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center max-w-[400px]">
          <p className="text-ink text-lg font-medium mb-2">Report not found</p>
          <p className="text-ink-secondary mb-6">{error}</p>
          <a href="/assess" className="text-sage underline text-lg">Take the assessment</a>
        </div>
      </main>
    );
  }

  return <ReportView report={report} />;
}

/* ─── Report layout ─── */

function ReportView({ report }: { report: CareReport }) {
  const scoreLabel = getScoreLabel(report.score);
  const scoreSubtext = getScoreSubtext(report.score);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggle = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const shareText = `I just checked how prepared my family is for my parents' care with GetSukoon. It opened my eyes to things I hadn't thought about. Try it — takes 2 minutes.`;

  return (
    <main className="min-h-dvh relative overflow-hidden">
      {/* Background warmth */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[100px] right-[10%] w-[400px] h-[400px] rounded-full bg-sage/[0.05] blur-xl" />
        <div className="absolute top-[40%] -left-[100px] w-[300px] h-[300px] rounded-full bg-mustard/[0.03] blur-xl" />
      </div>

      <div className="relative px-6 py-12 md:px-12 lg:px-24">
      {/* Header */}
      <header className="mb-8 flex items-center gap-3">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage">
          <path d="M4 16C4 16 6 10 12 6C12 6 14 4 16 4C16 4 16 8 14 12C10 14 4 16 4 16Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 10L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-[15px] tracking-wide text-ink-tertiary uppercase">GetSukoon</p>
      </header>

      {/* ─── Hero card (the screenshot unit) ─── */}
      <section className="max-w-[600px] mx-auto mb-12 animate-[fadeIn_0.5s_ease]">
        <div className="bg-surface/90 backdrop-blur-sm border border-border-subtle rounded-[16px] p-8 text-center shadow-[0_2px_24px_rgba(42,37,32,0.04)]">
          {/* Warm lead-in */}
          <p className="text-ink-secondary text-base mb-6">
            Your family&apos;s care readiness
          </p>

          {/* Score circle with soft glow */}
          <div className="relative mx-auto w-[150px] h-[150px] mb-5">
            <div className="absolute inset-0 rounded-full border-2 border-sage/15 scale-[1.2]" />
            <div className="w-full h-full rounded-full border-[5px] border-sage bg-cream flex items-center justify-center shadow-[0_4px_20px_rgba(122,139,111,0.1)]">
              <div>
                <span className="font-[family-name:var(--font-display)] text-[48px] font-bold text-ink leading-none">
                  {report.score}
                </span>
                <span className="text-ink-tertiary text-lg">/10</span>
              </div>
            </div>
          </div>
          <p className="text-xl font-semibold text-sage mb-2">{scoreLabel}</p>
          <p className="text-ink-secondary text-base leading-relaxed max-w-[340px] mx-auto mb-6">
            {scoreSubtext}
          </p>

          {/* Areas to explore */}
          {report.blindSpotCount > 0 && (
            <div className="bg-sage-light/60 rounded-[12px] px-5 py-4 text-left border border-sage/10">
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sage shrink-0">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M8 5.5V8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="8" cy="11" r="0.6" fill="currentColor" />
                </svg>
                <p className="font-semibold text-ink text-base">
                  {report.blindSpotCount} area{report.blindSpotCount > 1 ? "s" : ""} to explore together
                </p>
              </div>
              <p className="text-ink-tertiary text-sm mb-3 ml-[24px]">
                These are the things most families discover they need to talk about.
              </p>
              <div className="flex flex-wrap gap-2 ml-[24px]">
                {report.blindSpotAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/70 rounded-full text-sm text-ink-secondary border border-sage/10"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sage" />
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comparative context */}
          <p className="text-ink-tertiary text-sm mt-5">{report.comparativeContext}</p>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => {
              const url = typeof window !== "undefined" ? window.location.href : "";
              window.open(
                `https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + url)}`,
                "_blank"
              );
            }}
            className="flex-1 px-5 py-3 bg-surface border-2 border-border text-ink font-medium rounded-[10px] text-base min-h-[48px] hover:border-ink-tertiary transition-colors flex items-center justify-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1c1.2.7 2.6 1.1 4.1 1.1 4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5z" fill="#25D366"/>
              <path d="M14.2 12.1c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.1-.3.2-.5.1-.2-.1-1-.4-1.8-1.2-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.3.1-.5.1-.1.2-.3.3-.4.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.2-.7-1.7-.2-.4-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.4 3.8 3.4.5.2.9.4 1.3.5.5.2 1 .1 1.4.1.4-.1 1.3-.5 1.4-1 .2-.5.2-.9.1-1-.1-.1-.2-.2-.5-.3z" fill="white"/>
            </svg>
            Share on WhatsApp
          </button>
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            className="px-5 py-3 border-2 border-border text-ink font-medium rounded-[10px] text-base min-h-[48px] hover:border-ink-tertiary transition-colors"
          >
            Copy link
          </button>
        </div>
      </section>

      {/* ─── Expandable sections ─── */}
      <div className="max-w-[600px] mx-auto space-y-3">
        {/* Personalized insight — always open, warm tone */}
        {report.personalizedInsight && (
          <div className="bg-surface/90 border border-border-subtle rounded-[14px] p-6">
            <div className="flex items-start gap-3">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="text-sage mt-0.5 shrink-0">
                <path d="M11 3C11 3 7 7 7 11C7 15 11 19 11 19C11 19 15 15 15 11C15 7 11 3 11 3Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div>
                <p className="font-[family-name:var(--font-display)] text-lg font-medium text-ink mb-2">
                  What we noticed
                </p>
                <p className="text-ink-secondary text-base leading-relaxed">
                  {report.personalizedInsight}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly cost estimate */}
        <CollapsibleSection
          title="What care might cost"
          summary={`₹${(report.monthlyCostEstimate.low / 1000).toFixed(0)}K – ₹${(report.monthlyCostEstimate.high / 1000).toFixed(0)}K / month`}
          isOpen={expandedSections.has("costs")}
          onToggle={() => toggle("costs")}
        >
          <div className="flex items-end gap-2 mb-3">
            <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink">
              ₹{report.monthlyCostEstimate.low.toLocaleString("en-IN")}
            </span>
            <span className="text-ink-tertiary text-lg mb-0.5">to</span>
            <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-ink">
              ₹{report.monthlyCostEstimate.high.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-ink-secondary text-base">
            This is an estimate based on your parents&apos; city, ages, and health. It covers routine expenses, medical costs, and premiums. These costs typically grow 10-15% each year — planning ahead helps.
          </p>
        </CollapsibleSection>

        {/* Sibling split view */}
        {report.siblingSplitView && (
          <CollapsibleSection
            title="How your family coordinates"
            summary="Current care arrangement"
            isOpen={expandedSections.has("siblings")}
            onToggle={() => toggle("siblings")}
          >
            <p className="text-ink-secondary text-base leading-relaxed">
              {report.siblingSplitView}
            </p>
          </CollapsibleSection>
        )}

        {/* Things worth knowing — not "risk alerts" */}
        <CollapsibleSection
          title="Things worth knowing"
          summary={`${report.riskAlerts.length} things to be aware of`}
          isOpen={expandedSections.has("risks")}
          onToggle={() => toggle("risks")}
        >
          <div className="space-y-5">
            {report.riskAlerts.map((alert, i) => (
              <div key={i}>
                <p className="font-semibold text-ink text-base mb-1">{alert.title}</p>
                <p className="text-mustard text-sm font-medium mb-1.5">{alert.stat}</p>
                <p className="text-ink-secondary text-base leading-relaxed">
                  {alert.description}
                </p>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Steps you can take together — not "priority actions" */}
        <CollapsibleSection
          title="Steps you can take together"
          summary={`${report.priorityActions.length} practical next steps`}
          isOpen={expandedSections.has("actions")}
          onToggle={() => toggle("actions")}
        >
          <div className="space-y-5">
            {report.priorityActions.map((action, i) => {
              const urgencyLabel = {
                high: "Start here",
                medium: "When you're ready",
                low: "Good to know",
              };
              const urgencyStyle = {
                high: "bg-sage-light text-sage",
                medium: "bg-sand text-ink-secondary",
                low: "bg-sand text-ink-tertiary",
              };
              return (
                <div key={i}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-ink text-base">{i + 1}. {action.title}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${urgencyStyle[action.urgency]}`}>
                      {urgencyLabel[action.urgency]}
                    </span>
                  </div>
                  <p className="text-ink-secondary text-base leading-relaxed">
                    {action.description}
                  </p>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      </div>

      {/* ─── Enrichment: optional deeper sections ─── */}
      <EnrichmentPanel reportId={report.id} />

      {/* ─── Bottom CTA ─── */}
      <div className="max-w-[600px] mx-auto mt-10 pt-8 border-t border-border-subtle">
        <div className="bg-sand rounded-[12px] p-6">
          <p className="font-[family-name:var(--font-display)] text-xl font-medium text-ink mb-2">
            Save this to your Family Vault
          </p>
          <p className="text-ink-secondary text-base mb-4">
            Track your parents&apos; doctors, medicines, and daily check-ins — all in one place. Free, private, and always accessible.
          </p>
          <VaultCTA reportId={report.id} sessionId={report.sessionId} />
        </div>
      </div>

      {/* Closing note */}
      <div className="max-w-[600px] mx-auto mt-8 text-center">
        <p className="text-ink-tertiary text-sm">
          Caring for aging parents is one of the most important things you&apos;ll ever do.
          The fact that you&apos;re here means your family is in good hands.
        </p>
      </div>
      </div>
    </main>
  );
}

/* ─── Collapsible section ─── */

function CollapsibleSection({
  title,
  summary,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[12px] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-5 text-left min-h-[56px]"
      >
        <div>
          <p className="font-semibold text-ink text-base">{title}</p>
          <p className="text-ink-tertiary text-sm">{summary}</p>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          className={`text-ink-tertiary shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
      </button>
      {isOpen && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}

/* ─── Vault CTA — sign in to save ─── */

function VaultCTA({ reportId, sessionId }: { reportId: string; sessionId: string }) {
  const [mode, setMode] = useState<"initial" | "email-signup" | "email-signin">("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // Store session info before redirect
    sessionStorage.setItem("vault_session_id", sessionId);
    sessionStorage.setItem("vault_report_id", reportId);

    const { getSupabase } = await import("@/lib/supabase-browser");
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { getSupabase } = await import("@/lib/supabase-browser");
    const supabase = getSupabase();
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Link session and redirect
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      sessionStorage.setItem("vault_session_id", sessionId);
      sessionStorage.setItem("vault_report_id", reportId);
      window.location.href = "/vault?setup=true";
    } else {
      setError("Account created. Please sign in.");
      setMode("email-signin");
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { getSupabase } = await import("@/lib/supabase-browser");
    const supabase = getSupabase();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    sessionStorage.setItem("vault_session_id", sessionId);
    sessionStorage.setItem("vault_report_id", reportId);
    window.location.href = "/vault?setup=true";
  };

  if (mode === "initial") {
    return (
      <div className="space-y-3">
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-border rounded-[10px] text-ink font-medium text-base min-h-[52px] hover:border-ink-tertiary transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <button
          onClick={() => setMode("email-signup")}
          className="w-full px-6 py-3.5 bg-sage text-white font-medium rounded-[10px] text-base min-h-[52px] hover:opacity-90 transition-opacity"
        >
          Sign up with email
        </button>
        <button
          onClick={() => setMode("email-signin")}
          className="text-ink-tertiary text-sm hover:text-ink transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    );
  }

  const isSignUp = mode === "email-signup";

  return (
    <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-3">
      {error && (
        <p className="text-terracotta text-sm bg-terracotta-light px-3 py-2 rounded-lg">{error}</p>
      )}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        required
        className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        autoFocus
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (min 6 characters)"
        required
        minLength={6}
        className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full px-6 py-3.5 bg-sage text-white font-medium rounded-[10px] text-base min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? "Please wait..." : isSignUp ? "Create account" : "Sign in"}
      </button>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setMode(isSignUp ? "email-signin" : "email-signup")}
          className="text-ink-tertiary text-sm hover:text-ink transition-colors"
        >
          {isSignUp ? "Already have an account?" : "Need an account?"}
        </button>
        <button
          type="button"
          onClick={() => setMode("initial")}
          className="text-ink-tertiary text-sm hover:text-ink transition-colors ml-auto"
        >
          Back
        </button>
      </div>
    </form>
  );
}

/* ─── Vault progress panel — replaces old enrichment forms ─── */

function EnrichmentPanel({ reportId }: { reportId: string }) {
  void reportId; // kept for API compatibility

  const vaultSections = [
    {
      title: "Doctors & Health",
      description: "Track your parents' doctors, conditions, and specialists",
      href: "/vault/doctors",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      title: "Medicines",
      description: "Daily medication schedule with dosage and timing",
      href: "/vault/medicines",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="6" y="3" width="12" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 11H18" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: "Expenses",
      description: "Monthly costs — recurring and one-time",
      href: "/vault/expenses",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 11H21" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: "Financial Assets",
      description: "Bank accounts, insurance, property, investments",
      href: "/vault/assets",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 7V5C7 3.89543 7.89543 3 9 3H15C16.1046 3 17 3.89543 17 5V7" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      title: "Emergency Contacts",
      description: "Neighbors, helpers, family — the people your parents rely on",
      href: "/vault/contacts",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-sage">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-[600px] mx-auto mt-10 pt-8 border-t border-border-subtle">
      <p className="font-[family-name:var(--font-display)] text-xl font-medium text-ink mb-1">
        Build your Family Vault
      </p>
      <p className="text-ink-tertiary text-base mb-5">
        The more you add, the better your care plan gets. Sign in to save everything securely.
      </p>

      <div className="space-y-2">
        {vaultSections.map((section) => (
          <a
            key={section.href}
            href={section.href}
            className="flex items-center gap-4 bg-surface border border-border-subtle rounded-[12px] px-5 py-4 min-h-[56px] hover:border-sage/40 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-sage-light flex items-center justify-center shrink-0">
              {section.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-ink text-base group-hover:text-sage transition-colors">{section.title}</p>
              <p className="text-ink-tertiary text-sm">{section.description}</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-ink-tertiary shrink-0 group-hover:text-sage transition-colors">
              <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Client-side fallback report generator ─── */

function generateClientReport(assessment: Record<string, unknown>, id: string): CareReport {
  const diagnosticScore = (assessment.diagnosticScore as number) || 4;
  const blindSpots = (assessment.financialBlindSpots as Array<{ label: string; status: string }>) || [];
  const unknownSpots = blindSpots.filter((bs) => bs.status !== "yes");

  return {
    id,
    sessionId: (assessment.sessionId as string) || id,
    score: diagnosticScore,
    blindSpotCount: unknownSpots.length,
    blindSpotAreas: unknownSpots.map((bs) => bs.label),
    monthlyCostEstimate: { low: 35000, high: 85000 },
    siblingSplitView: null,
    riskAlerts: [
      { title: "Unclaimed assets", stat: "₹1.84 lakh crore unclaimed across India", description: "Without a record of your parents' financial accounts, some assets could become difficult to access over time. This is especially common with old FDs and dormant savings accounts." },
      { title: "Insurance renewals", stat: "53% of LIC policies lapse before maturity", description: "If nobody is tracking premium due dates, years of paid premiums could be lost. Setting up a simple reminder system can prevent this." },
      { title: "Having a will matters", stat: "85% of Indian families have no will", description: "A registered will is one of the most loving things a family can sort out together. Without one, property decisions can take years to resolve." },
    ],
    priorityActions: [
      { title: "Start the conversation", description: "Find a calm moment to ask your parents about their accounts, policies, and documents. You don't need exact amounts — just knowing what exists and where is a huge first step.", urgency: "high" },
      { title: "Set up insurance reminders", description: "Find out when every policy (health + life) is due for renewal. A calendar reminder 30 days before each one is all it takes.", urgency: "high" },
      { title: "Map out the costs together", description: "Sit down with your family and list monthly expenses — known and estimated. Having a shared picture, even a rough one, reduces anxiety for everyone.", urgency: "medium" },
    ],
    personalizedInsight: "By taking this assessment, you've already done what most families put off. The areas above aren't things to worry about — they're things you can work through together, one at a time.",
    comparativeContext: `Most families score between 3 and 5. ${diagnosticScore <= 3 ? "You're at the start of an important journey." : "You've got a foundation to build on."}`,
    createdAt: new Date().toISOString(),
  };
}
