import Link from "next/link";
import { Logo } from "@/lib/logo";
import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink } from "@/lib/auth-widgets";

export default function Home() {
  return (
    <main className="min-h-dvh relative overflow-hidden">
      <Watermark />
      {/* Warm decorative background shapes */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Large soft circle — top right */}
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-sage/[0.06]" />
        {/* Small warm circle — bottom left */}
        <div className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full bg-terracotta/[0.04]" />
        {/* Subtle warm wash — mid page */}
        <div className="absolute top-[60%] right-[10%] w-[400px] h-[400px] rounded-full bg-mustard/[0.04] blur-3xl" />
      </div>

      <div className="relative px-6 pt-6 pb-12 md:px-12 lg:px-24 md:pt-8 flex flex-col min-h-dvh">
        {/* Header — auth-aware sign-in / back-to-vault affordance */}
        <header className="mb-12 flex items-center justify-between gap-4">
          <Logo />
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="https://github.com/orangeaka/fraud-guard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] text-sm font-medium text-ink border border-border rounded-full hover:border-ink-tertiary transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Star on GitHub
            </a>
            <AuthHeaderLink />
          </div>
        </header>

        {/* Hero + Stats — side by side on desktop */}
        <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">
          {/* Hero */}
          <section className="max-w-[680px] lg:flex-1 flex flex-col justify-center">
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(32px,6vw,52px)] leading-[1.15] font-light text-ink tracking-tight mb-6">
              Taking care of your parents starts with five questions most
              families never talk about.
            </h1>
            <p className="text-xl text-ink-secondary leading-relaxed max-w-[540px] mb-10">
              Take a 2-minute assessment. Find out where your family stands —
              and what small steps can make a big difference.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/assess"
                className="inline-flex items-center justify-center px-8 py-4 bg-sage text-white text-lg font-medium rounded-[10px] hover:opacity-90 transition-opacity min-h-[52px]"
              >
                Take the assessment
              </Link>
              <span className="text-ink-tertiary text-base">Free · 2 minutes · No login</span>
            </div>

            {/* Safety card — visual signpost */}
            <Link href="/safety" className="block mt-10 max-w-[540px] group">
              <div className="bg-sage-light/50 border border-sage/15 rounded-[14px] p-5 flex items-start gap-4 hover:border-sage/30 transition-colors">
                <div className="shrink-0 w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center mt-0.5">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage">
                    <path d="M10 2L16 5V10C16 13.5 13 16.5 10 18C7 16.5 4 13.5 4 10V5L10 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinejoin="round" />
                    <path d="M7.5 10L9 11.5L12.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ink font-medium text-[15px] md:text-base mb-1">
                    5 scams targeting Indian parents right now
                  </p>
                  <p className="text-ink-secondary text-sm leading-relaxed">
                    A short guide — plus Saaya, a companion app for the parent&apos;s phone that catches them in real time.
                  </p>
                  <span className="inline-block mt-2 text-sage text-sm font-medium group-hover:underline">
                    Read the safety guide →
                  </span>
                </div>
              </div>
            </Link>
          </section>

          {/* Stats — stacked cards on the right on desktop */}
          <section className="mt-16 lg:mt-0 lg:w-[340px] xl:w-[380px] shrink-0">
            <p className="text-ink-tertiary text-sm uppercase tracking-wide mb-5">Why this matters</p>
            <div className="flex flex-row lg:flex-col gap-4 overflow-x-auto lg:overflow-visible">
              <StatCard number="6–12" label="institutions hold a typical parent's finances — with no single view" />
              <StatCard number="75%" label="of Indian seniors manage at least one chronic condition" />
              <StatCard number="83%" label="of Indian seniors have no health insurance" />
            </div>
            <p className="mt-4 text-xs text-ink-tertiary">
              Sources: RBI, LASI Wave 1, Outlook Money
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-surface/80 border border-border-subtle rounded-[12px] p-5 min-w-[180px] sm:min-w-[220px] lg:min-w-0">
      <p className="font-[family-name:var(--font-display)] text-[26px] font-semibold text-ink leading-tight mb-1">
        {number}
      </p>
      <p className="text-[15px] text-ink-secondary leading-snug">{label}</p>
    </div>
  );
}

/* ─── Warm SVG icons ─── */

function LeafIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage">
      <path
        d="M4 16C4 16 6 10 12 6C12 6 14 4 16 4C16 4 16 8 14 12C10 14 4 16 4 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.12"
      />
      <path
        d="M10 10L4 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

