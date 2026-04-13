"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { CareReport } from "@/lib/types";
import { Logo } from "@/lib/logo";
import { Watermark } from "@/lib/watermark";
import { getScoreLabel, getScoreSubtext } from "@/lib/scoring";
import { useAuth } from "@/lib/auth";
import { PrivacyTrustLine } from "@/lib/privacy-trust";

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<CareReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      // Try sessionStorage first (most reliable — survives HMR and server restarts)
      if (typeof window !== "undefined") {
        try {
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
        } catch {
          // Corrupt sessionStorage — fall through to server API
          sessionStorage.removeItem(`report-${id}`);
          sessionStorage.removeItem(`assessment-${id}`);
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
  const searchParams = useSearchParams();
  const { user, loading: authLoading, authFetch } = useAuth();
  const isUnlocked = !!user;
  const [justUnlocked, setJustUnlocked] = useState(false);

  // Detect shared view: visitor didn't take this assessment themselves
  const [isSharedView, setIsSharedView] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasLocal = sessionStorage.getItem(`report-${report.id}`) || sessionStorage.getItem(`assessment-${report.id}`);
    setIsSharedView(!hasLocal);
  }, [report.id]);

  // Handle ?setup=true — link session after OAuth return
  useEffect(() => {
    if (!user || searchParams.get("setup") !== "true") return;

    const linkSession = async () => {
      const sessionId = sessionStorage.getItem("vault_session_id");
      const reportId = sessionStorage.getItem("vault_report_id");
      if (sessionId) {
        await authFetch("/api/link-session", {
          method: "POST",
          body: JSON.stringify({ sessionId, reportId }),
        });
        sessionStorage.removeItem("vault_session_id");
        sessionStorage.removeItem("vault_report_id");
      }
      // Strip query param
      window.history.replaceState({}, "", `/report/${report.id}`);
    };

    linkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const scoreLabel = getScoreLabel(report.score);
  const scoreSubtext = getScoreSubtext(report.score);
  const shareText = `I just checked how prepared my family is for my parents' care with Inaya. It opened my eyes to things I hadn't thought about. Try it — takes 2 minutes.`;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <main className="min-h-dvh relative overflow-hidden">
      <Watermark />

      {/* Header — left aligned */}
      <header className="relative px-6 pt-6 md:px-12 lg:px-24 md:pt-8">
        <Logo />
      </header>

      {/* Centered content column */}
      <div className="relative max-w-[720px] mx-auto px-6 pt-8 pb-12 md:pt-10">

        {/* ─── Score hero ─── */}
        <section className="text-center mb-8 animate-[fadeIn_0.5s_ease]">
          <p className="text-xs text-ink-tertiary uppercase tracking-wide mb-6">
            {isSharedView ? "Their care readiness score" : "Your family\u2019s care readiness"}
          </p>

          {/* Score with leaf behind it */}
          <div className="relative inline-block mb-5">
            <Image
              src="/logo-icon.png"
              alt=""
              width={180}
              height={180}
              className="absolute inset-0 w-full h-full opacity-[0.12] scale-110"
              aria-hidden="true"
            />
            <div className="relative w-[160px] h-[160px] md:w-[180px] md:h-[180px] rounded-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sage-light/40 to-cream border-[3px] border-sage/30 shadow-[0_8px_32px_rgba(122,139,111,0.15)]" />
              <div className="relative">
                <span className="font-[family-name:var(--font-display)] text-[72px] md:text-[84px] font-bold text-ink leading-none">
                  {report.score}
                </span>
                <span className="text-ink-tertiary text-xl">/10</span>
              </div>
            </div>
          </div>

          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-sage mb-2">
            {scoreLabel}
          </h1>
          <p className="text-ink-secondary text-sm md:text-base max-w-[440px] mx-auto mb-4">
            {isSharedView
              ? "Someone you know checked how prepared their family is. How about yours?"
              : scoreSubtext}
          </p>

          <p className="text-ink-tertiary text-sm mb-5">{report.comparativeContext}</p>

          {/* Share buttons — only for the person who took it */}
          {!isSharedView && (
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`, "_blank")}
                className="px-4 py-2.5 min-h-[44px] bg-surface border border-border text-ink text-sm font-medium rounded-full hover:border-ink-tertiary transition-colors flex items-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"><path d="M10 1.5C5.3 1.5 1.5 5.3 1.5 10c0 1.5.4 2.9 1.1 4.2L1.5 18.5l4.4-1.1c1.2.7 2.6 1.1 4.1 1.1 4.7 0 8.5-3.8 8.5-8.5S14.7 1.5 10 1.5z" fill="#25D366"/></svg>
                Share
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(shareUrl)}
                className="px-4 py-2.5 min-h-[44px] border border-border text-ink-tertiary text-sm font-medium rounded-full hover:border-ink-tertiary transition-colors"
              >
                Copy link
              </button>
            </div>
          )}
        </section>

        {/* ─── Owner-only: What we noticed ─── */}
        {!isSharedView && report.personalizedInsight && (
          <section className="mb-8">
            <p className="text-ink-secondary text-sm md:text-base italic leading-relaxed">
              <span className="font-[family-name:var(--font-display)] text-ink not-italic font-medium">What we noticed — </span>
              {report.personalizedInsight}
            </p>
          </section>
        )}

        {/* ─── Owner-only: Things worth knowing — compact ─── */}
        {!isSharedView && (
          <section className="mb-8">
            <h2 className="text-base md:text-lg font-semibold text-ink mb-3">Things worth knowing</h2>
            <div className="grid gap-2">
              {report.riskAlerts.map((alert, i) => (
                <div key={i} className="bg-surface border border-border-subtle rounded-[10px] px-4 py-3 flex items-baseline gap-2 flex-wrap">
                  <p className="font-semibold text-ink text-sm">{alert.title}</p>
                  <p className="text-mustard text-xs font-medium">{alert.stat}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── GATE: Signup gate (only when not authed AND not shared view) ─── */}
        {!isSharedView && !authLoading && !isUnlocked && (
          <SignupGate
            reportId={report.id}
            sessionId={report.sessionId}
            onUnlocked={() => setJustUnlocked(true)}
          />
        )}

        {/* ─── GATED: Cost + Coordination + Actions (owner only, authed) ─── */}
        {!isSharedView && isUnlocked && (
          <div className={justUnlocked ? "animate-[fadeIn_0.5s_ease]" : ""}>
            {/* Cost + Coordination (2 cols on desktop) */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-surface border border-border-subtle rounded-[12px] p-5">
                <p className="text-xs text-ink-tertiary uppercase tracking-wide mb-2">Monthly cost estimate</p>
                <p className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-ink mb-1">
                  ₹{(report.monthlyCostEstimate.low / 1000).toFixed(0)}K – ₹{(report.monthlyCostEstimate.high / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-ink-tertiary">Per month · grows 10-15% yearly</p>
              </div>
              {report.siblingSplitView && (
                <div className="bg-surface border border-border-subtle rounded-[12px] p-5">
                  <p className="text-xs text-ink-tertiary uppercase tracking-wide mb-2">Family coordination</p>
                  <p className="text-ink-secondary text-sm leading-relaxed">{report.siblingSplitView}</p>
                </div>
              )}
            </section>

            {/* Steps you can take together */}
            <section className="mb-8">
              <h2 className="text-base md:text-lg font-semibold text-ink mb-3">Steps you can take together</h2>
              <div className="space-y-3">
                {report.priorityActions.map((action, i) => {
                  const urgencyLabel: Record<string, string> = { high: "Start here", medium: "When you're ready", low: "Good to know" };
                  const urgencyStyle: Record<string, string> = { high: "bg-sage text-white", medium: "bg-mustard-light text-mustard", low: "bg-sand text-ink-tertiary" };
                  return (
                    <div key={i} className="bg-surface border border-border-subtle rounded-[12px] p-4 md:p-5 flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full bg-sage-light text-sage font-semibold text-sm flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-semibold text-ink text-sm md:text-base">{action.title}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${urgencyStyle[action.urgency]}`}>
                            {urgencyLabel[action.urgency]}
                          </span>
                        </div>
                        <p className="text-ink-secondary text-sm leading-relaxed">{action.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Go to your vault CTA */}
            <section className="text-center">
              <Link
                href="/vault"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-sage text-white font-medium rounded-[10px] text-base min-h-[52px] hover:opacity-90 transition-opacity"
              >
                Go to your vault →
              </Link>
            </section>
          </div>
        )}

        {/* ─── Shared view: primary CTA to take assessment ─── */}
        {isSharedView && (
          <section className="text-center mt-2 mb-4">
            <Link
              href="/assess"
              className="inline-flex items-center justify-center px-8 py-4 bg-sage text-white text-lg font-medium rounded-[10px] hover:opacity-90 transition-opacity min-h-[52px]"
            >
              Take your care assessment →
            </Link>
            <p className="text-ink-tertiary text-sm mt-3">Free · 2 minutes · No login</p>
            <p className="mt-4">
              <Link href="/join" className="text-ink-tertiary text-sm hover:text-ink transition-colors underline underline-offset-2">
                Already have an account? Sign in
              </Link>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

/* ─── Signup Gate — replaces VaultCTA ─── */

function SignupGate({
  reportId,
  sessionId,
  onUnlocked,
}: {
  reportId: string;
  sessionId: string;
  onUnlocked: () => void;
}) {
  const [mode, setMode] = useState<"initial" | "email-signup" | "email-signin">("initial");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    // Store session info + return path before redirect
    sessionStorage.setItem("vault_session_id", sessionId);
    sessionStorage.setItem("vault_report_id", reportId);
    sessionStorage.setItem("return_to_report", reportId);

    const { getSupabase } = await import("@/lib/supabase-browser");
    const supabase = getSupabase();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const linkSessionAndUnlock = async (accessToken: string) => {
    await fetch("/api/link-session", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId, reportId }),
    });
    sessionStorage.removeItem("vault_session_id");
    sessionStorage.removeItem("vault_report_id");
    onUnlocked();
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

    // Check if session was created (auto-confirm enabled)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await linkSessionAndUnlock(session.access_token);
    } else {
      setError("Account created. Please sign in.");
      setMode("email-signin");
    }
    setLoading(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const { getSupabase } = await import("@/lib/supabase-browser");
    const supabase = getSupabase();
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      await linkSessionAndUnlock(data.session.access_token);
    }
    setLoading(false);
  };

  return (
    <section className="bg-sand rounded-[14px] p-5 md:p-6 mb-8">
      <p className="font-semibold text-ink text-base md:text-lg mb-1">
        Your personalized care plan is ready
      </p>
      <p className="text-ink-secondary text-sm mb-4">
        Create a free account to unlock:
      </p>

      {/* Checklist preview of gated content */}
      <div className="space-y-2 mb-5">
        {[
          "Monthly cost estimate for your family",
          "Priority action steps — personalized to your situation",
          "Sibling coordination plan",
        ].map((item) => (
          <div key={item} className="flex items-start gap-2.5">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0">
              <path d="M13.3 4.3 6.5 11.1 2.7 7.3" stroke="#7A8B6F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-ink text-sm">{item}</span>
          </div>
        ))}
      </div>

      {mode === "initial" ? (
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
      ) : (
        <form onSubmit={mode === "email-signup" ? handleEmailSignUp : handleEmailSignIn} className="space-y-3">
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
            {loading ? "Please wait..." : mode === "email-signup" ? "Create account" : "Sign in"}
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMode(mode === "email-signup" ? "email-signin" : "email-signup")}
              className="text-ink-tertiary text-sm hover:text-ink transition-colors"
            >
              {mode === "email-signup" ? "Already have an account?" : "Need an account?"}
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
      )}

      <PrivacyTrustLine className="mt-4 pt-3 border-t border-border-subtle" />
    </section>
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
