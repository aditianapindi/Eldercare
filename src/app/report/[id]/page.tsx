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
  const shareText = `I just checked how prepared my family is for my parents' care with GetSukoon. It opened my eyes to things I hadn't thought about. Try it — takes 2 minutes.`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-dvh relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[100px] right-[10%] w-[400px] h-[400px] rounded-full bg-sage/[0.05] blur-xl" />
      </div>

      <div className="relative px-6 py-8 md:px-12 lg:px-24 max-w-[900px] mx-auto">
        {/* Header */}
        <header className="mb-6 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-sage">
            <path d="M4 16C4 16 6 10 12 6C12 6 14 4 16 4C16 4 16 8 14 12C10 14 4 16 4 16Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 10L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-sm tracking-wide text-ink-tertiary uppercase">GetSukoon</p>
        </header>

        {/* ─── Score hero + Vault CTA side by side on desktop ─── */}
        <div className="md:flex md:gap-6 mb-8">
          {/* Score card */}
          <div className="bg-surface/90 backdrop-blur-sm border border-border-subtle rounded-[16px] p-6 md:p-8 text-center shadow-[0_2px_24px_rgba(42,37,32,0.04)] md:flex-1 mb-4 md:mb-0 animate-[fadeIn_0.5s_ease]">
            <p className="text-ink-secondary text-sm mb-4">Your family&apos;s care readiness</p>
            <div className="relative mx-auto w-[120px] h-[120px] md:w-[140px] md:h-[140px] mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-sage/15 scale-[1.15]" />
              <div className="w-full h-full rounded-full border-[5px] border-sage bg-cream flex items-center justify-center">
                <div>
                  <span className="font-[family-name:var(--font-display)] text-[40px] md:text-[48px] font-bold text-ink leading-none">{report.score}</span>
                  <span className="text-ink-tertiary text-base">/10</span>
                </div>
              </div>
            </div>
            <p className="text-lg font-semibold text-sage mb-1">{scoreLabel}</p>
            <p className="text-ink-secondary text-sm max-w-[300px] mx-auto mb-4">{scoreSubtext}</p>

            {/* Blind spots as pills */}
            {report.blindSpotCount > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                {report.blindSpotAreas.map((area) => (
                  <span key={area} className="px-2.5 py-1 bg-sage-light/60 rounded-full text-xs text-sage font-medium border border-sage/10">
                    {area}
                  </span>
                ))}
              </div>
            )}

            <p className="text-ink-tertiary text-xs">{report.comparativeContext}</p>

            {/* Share */}
            <div className="flex gap-2 mt-4 justify-center">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, "_blank")}
                className="px-4 py-2 bg-surface border border-border text-ink text-sm font-medium rounded-full hover:border-ink-tertiary transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1c1.2.7 2.6 1.1 4.1 1.1 4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5z" fill="#25D366"/></svg>
                Share
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(shareUrl)}
                className="px-4 py-2 border border-border text-ink-tertiary text-sm font-medium rounded-full hover:border-ink-tertiary transition-colors"
              >
                Copy link
              </button>
            </div>
          </div>

          {/* Vault CTA — prominent, right next to score */}
          <div className="bg-sand rounded-[16px] p-6 md:w-[320px] shrink-0">
            <p className="font-[family-name:var(--font-display)] text-lg font-medium text-ink mb-1">
              Save &amp; track your care
            </p>
            <p className="text-ink-secondary text-sm mb-4">
              Doctors, medicines, expenses, daily check-ins — all in one place.
            </p>
            <VaultCTA reportId={report.id} sessionId={report.sessionId} />
          </div>
        </div>

        {/* ─── Compact details grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Personalized insight */}
          {report.personalizedInsight && (
            <div className="bg-surface border border-border-subtle rounded-[12px] p-4 md:col-span-2">
              <p className="text-ink-secondary text-sm leading-relaxed">
                <span className="font-semibold text-ink">What we noticed: </span>
                {report.personalizedInsight}
              </p>
            </div>
          )}

          {/* Cost estimate */}
          <div className="bg-surface border border-border-subtle rounded-[12px] p-4">
            <p className="text-ink-tertiary text-xs font-medium uppercase tracking-wide mb-1">Monthly cost estimate</p>
            <p className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold text-ink">
              ₹{(report.monthlyCostEstimate.low / 1000).toFixed(0)}K – ₹{(report.monthlyCostEstimate.high / 1000).toFixed(0)}K
            </p>
            <p className="text-ink-tertiary text-xs mt-1">Grows 10-15% yearly</p>
          </div>

          {/* Coordination */}
          {report.siblingSplitView && (
            <div className="bg-surface border border-border-subtle rounded-[12px] p-4">
              <p className="text-ink-tertiary text-xs font-medium uppercase tracking-wide mb-1">Family coordination</p>
              <p className="text-ink-secondary text-sm leading-relaxed">{report.siblingSplitView}</p>
            </div>
          )}

          {/* Risk alerts — compact list */}
          <div className="bg-surface border border-border-subtle rounded-[12px] p-4">
            <p className="text-ink-tertiary text-xs font-medium uppercase tracking-wide mb-2">Things worth knowing</p>
            <div className="space-y-2">
              {report.riskAlerts.map((alert, i) => (
                <div key={i}>
                  <p className="text-ink text-sm font-medium">{alert.title}</p>
                  <p className="text-mustard text-xs">{alert.stat}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action items — checklist */}
          <div className="bg-surface border border-border-subtle rounded-[12px] p-4">
            <p className="text-ink-tertiary text-xs font-medium uppercase tracking-wide mb-2">Next steps</p>
            <div className="space-y-2">
              {report.priorityActions.map((action, i) => {
                const urgencyStyle: Record<string, string> = { high: "bg-sage text-white", medium: "bg-mustard-light text-mustard", low: "bg-sand text-ink-tertiary" };
                return (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 shrink-0 ${urgencyStyle[action.urgency]}`}>
                      {i + 1}
                    </span>
                    <p className="text-ink text-sm">{action.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
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
