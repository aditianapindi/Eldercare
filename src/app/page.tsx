import Link from "next/link";
import { Logo } from "@/lib/logo";
import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink } from "@/lib/auth-widgets";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* ── Announcement strip ── */}
      <div className="bg-ink text-cream">
        <Link
          href="/saaya"
          className="flex items-center justify-center gap-1.5 px-6 py-2.5 md:py-2 text-center text-sm hover:opacity-80 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="shrink-0 text-terracotta" aria-hidden="true">
            <path d="M10 2L16 5V10C16 13.5 13 16.5 10 18C7 16.5 4 13.5 4 10V5L10 2Z" stroke="currentColor" strokeWidth="1.3" fill="currentColor" fillOpacity="0.25" strokeLinejoin="round" />
            <path d="M7.5 10L9 11.5L12.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <span className="font-medium">Saaya</span>
            <span className="text-cream/70 mx-1">—</span>
            <span className="text-cream/80">catches scam calls before money moves.</span>
            <span className="text-cream/60 ml-1.5 hidden sm:inline">Get the app →</span>
            <span className="text-cream/60 ml-1.5 sm:hidden">→</span>
          </span>
        </Link>
      </div>

      {/* ── Hero section ── */}
      <div className="relative min-h-[calc(100dvh-44px)]">
        <Watermark />
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-sage/[0.06]" />
          <div className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full bg-terracotta/[0.04]" />
          <div className="absolute top-[60%] right-[10%] w-[400px] h-[400px] rounded-full bg-mustard/[0.04] blur-3xl" />
        </div>

        <div className="relative px-6 pt-6 pb-16 md:px-12 lg:px-24 md:pt-8 flex flex-col min-h-[calc(100dvh-44px)]">
          <header className="mb-12 flex items-center justify-between gap-4">
            <Logo />
            <AuthHeaderLink />
          </header>

          <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">
            {/* Hero copy */}
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
            </section>

            {/* Stats */}
            <section className="mt-16 lg:mt-0 lg:w-[340px] xl:w-[380px] shrink-0">
              <p className="text-ink-tertiary text-sm uppercase tracking-wide mb-5">Why this matters</p>
              <div className="flex flex-col gap-4">
                <StatCard number="6–12" label="institutions hold a typical parent's finances — with no single view" />
                <StatCard number="75%" label="of seniors manage at least one chronic condition" />
                <StatCard number="83%" label="of seniors have no health insurance" />
              </div>
              <p className="mt-4 text-xs text-ink-tertiary">
                Sources: RBI, LASI Wave 1, Outlook Money
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* ── Saaya showcase — dark section, scroll reveal ── */}
      <section className="bg-ink text-cream relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[20%] -right-[150px] w-[400px] h-[400px] rounded-full bg-terracotta/[0.06]" />
          <div className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full bg-sage/[0.04]" />
        </div>

        <div className="relative px-6 py-16 md:px-12 lg:px-24 md:py-24">
          <div className="max-w-[900px]">
            <p className="text-cream/50 text-xs uppercase tracking-wide mb-4 font-semibold">
              Companion app
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[clamp(28px,5vw,44px)] leading-[1.15] font-light tracking-tight mb-6">
              One phone call can cost your parents everything.{" "}
              <span className="text-terracotta">Saaya watches for it.</span>
            </h2>
            <p className="text-cream/70 text-lg md:text-xl leading-relaxed max-w-[620px] mb-10">
              A small app for your parent&apos;s phone. When an unknown caller is on the
              line and a banking app opens, Saaya steps in with a full-screen warning,
              a voice alert, and an SMS to you.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-14">
              <Link
                href="/saaya"
                className="inline-flex items-center justify-center px-6 py-3.5 bg-terracotta text-white text-base font-medium rounded-[10px] hover:opacity-90 transition-opacity min-h-[52px]"
              >
                Get Saaya →
              </Link>
              <span className="text-cream/40 text-sm">Free · Open source · Android 8.0+</span>
            </div>

            {/* Three responses */}
            <div className="grid gap-4 md:gap-5 md:grid-cols-3">
              {[
                { n: "1", title: "Full-screen warning", detail: "30-second countdown. Hard to miss, hard to dismiss." },
                { n: "2", title: "Hindi voice alert", detail: "On speaker. Everyone in the room hears it." },
                { n: "3", title: "SMS to you", detail: "From the parent's SIM. No internet needed." },
              ].map((r) => (
                <div key={r.n} className="border border-cream/10 rounded-[14px] p-5 md:p-6">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-terracotta/20 text-terracotta font-semibold text-xs font-[family-name:var(--font-display)] mb-3">
                    {r.n}
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-cream leading-snug mb-2">
                    {r.title}
                  </h3>
                  <p className="text-cream/60 text-[15px] leading-relaxed">{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative text-center py-6 text-xs text-ink-tertiary bg-cream">
        <Link href="/privacy" className="hover:text-ink transition-colors underline underline-offset-2">
          Privacy
        </Link>
        <span className="mx-2">·</span>
        <span>Inaya — How prepared is your family?</span>
      </footer>
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
