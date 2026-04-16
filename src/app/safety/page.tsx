import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink, LogoWithAuthLink } from "@/lib/auth-widgets";
import { SafetyHeroCTAs, SafetyStickyBar } from "./safety-client";
import { SaayaDownload } from "@/lib/saaya-download";

export const metadata = {
  title: "Family Safety — Protect your parents from scams | Inaya",
  description:
    "The 5 scams targeting Indian parents right now — and what to do if it happens. From Inaya, the family care vault.",
};

const SCAMS = [
  {
    name: "Digital arrest",
    icon: "📹",
    how: "Fake CBI officer on video call — \"transfer to a safe account.\"",
    flag: "No agency arrests anyone over a video call.",
  },
  {
    name: "KYC update",
    icon: "🏦",
    how: "\"Your bank KYC expired.\" Phishing link or AnyDesk follows.",
    flag: "Banks never ask for OTP or remote access.",
  },
  {
    name: "Courier scam",
    icon: "📦",
    how: "\"A package in your name has contraband\" — fake police on the line.",
    flag: "Couriers don't call about contraband.",
  },
  {
    name: "Family emergency",
    icon: "📞",
    how: "\"Your son had an accident — send money.\" Sometimes AI-cloned voice.",
    flag: "Call your child on their real number first.",
  },
  {
    name: "Lottery / refund",
    icon: "🎰",
    how: "\"You've won ₹25 lakh — pay a small processing fee.\"",
    flag: "Can't win a lottery you didn't enter.",
  },
];

export default function SafetyPage() {
  return (
    <main className="min-h-dvh relative overflow-hidden pb-[120px] md:pb-[100px]">
      <Watermark />
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-sage/[0.06]" />
        <div className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full bg-terracotta/[0.04]" />
      </div>

      <div className="relative px-6 pt-6 md:px-12 lg:px-24 md:pt-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <LogoWithAuthLink />
          <AuthHeaderLink />
        </header>

        {/* Hero */}
        <section className="max-w-[760px] mb-10 md:mb-14">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,5vw,40px)] leading-[1.2] font-light text-ink tracking-tight mb-4">
            One phone call cost a family{" "}
            <span className="text-terracotta font-normal">₹1.5 lakh</span>.
            Here&apos;s what every family should know.
          </h1>
          <p className="text-lg text-ink-secondary leading-relaxed max-w-[620px] mb-6">
            Inaya is the family care vault that keeps your parents&apos; health,
            money and safety essentials in one place — for the whole family.
          </p>
          <SafetyHeroCTAs />
        </section>

        {/* Scam cards */}
        <section id="scams" className="max-w-[900px] mb-10 md:mb-14 scroll-mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-light text-ink leading-tight mb-4">
            The 5 scams targeting Indian parents right now.
          </h2>
          <div className="grid gap-3 md:gap-3 md:grid-cols-2">
            {SCAMS.map((scam) => (
              <div
                key={scam.name}
                className="bg-surface border border-border-subtle rounded-[12px] overflow-hidden"
              >
                <div className="px-4 py-3">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-xl" aria-hidden="true">{scam.icon}</span>
                    <h3 className="font-semibold text-ink text-sm md:text-[15px] leading-snug">
                      {scam.name}
                    </h3>
                  </div>
                  <p className="text-ink-secondary text-xs md:text-sm leading-relaxed">
                    {scam.how}
                  </p>
                </div>
                <div className="bg-mustard-light/50 px-4 py-2 border-t border-mustard/10">
                  <p className="text-ink text-xs font-medium">
                    <span className="text-mustard">⚑</span> {scam.flag}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Helpline — compact inline */}
        <section className="max-w-[900px] mb-10 md:mb-14">
          <div className="bg-surface border border-border-subtle rounded-[12px] px-4 py-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className="text-ink-tertiary text-[10px] font-bold uppercase tracking-wide">If it happened</span>
              <a href="tel:1930" className="group flex items-baseline gap-2">
                <span className="font-[family-name:var(--font-display)] text-3xl font-medium text-terracotta group-hover:opacity-80 transition-opacity">
                  1930
                </span>
                <span className="text-ink-secondary text-sm">Cybercrime Helpline</span>
              </a>
            </div>
            <p className="text-ink-tertiary text-xs leading-relaxed">
              Call within the first hour.{" "}
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage font-medium underline underline-offset-2 decoration-sage/40 hover:decoration-sage"
              >
                cybercrime.gov.in
              </a>
              {" "}· 24×7, free.
            </p>
          </div>
        </section>

        {/* Companion app */}
        <section id="app" className="max-w-[900px] mb-10 md:mb-14 scroll-mt-6">
          <p className="text-ink-tertiary text-xs uppercase tracking-wide mb-2 font-semibold">
            Companion app, Saaya
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-light text-ink leading-tight mb-3">
            We built an app that catches these calls in real time.
          </h2>
          <p className="text-ink-secondary text-sm md:text-base leading-relaxed max-w-[620px] mb-5">
            A small Android companion for the parent&apos;s phone. It watches for the
            dangerous moment — an unknown caller while a banking or UPI app is open — and
            triggers three things at once:
          </p>

          <div className="grid gap-3 md:grid-cols-3 mb-5">
            {[
              { n: "1", title: "Red warning overlay", detail: "Full-screen, 30-second countdown to think." },
              { n: "2", title: "Hindi voice alert", detail: "On speaker, audible to everyone in the room." },
              { n: "3", title: "SMS to you", detail: "Instant, from the parent's SIM. No internet needed." },
            ].map((r) => (
              <div key={r.n} className="bg-surface border border-border-subtle rounded-[12px] p-4">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-terracotta-light text-terracotta font-semibold text-[10px] font-[family-name:var(--font-display)] mb-2">{r.n}</span>
                <h3 className="font-semibold text-ink text-sm mb-1">{r.title}</h3>
                <p className="text-ink-secondary text-xs leading-relaxed">{r.detail}</p>
              </div>
            ))}
          </div>

          {/* Download Saaya */}
          <div className="bg-mustard-light/40 border border-mustard/20 rounded-[12px] px-4 py-3 mb-5">
            <div className="mb-3">
              <span className="text-mustard text-[9px] font-bold uppercase tracking-wide">Free · Open source · Android 8.0+</span>
              <p className="text-ink-secondary text-xs leading-relaxed mt-0.5">
                Download Saaya and install it on your parent&apos;s phone.
              </p>
            </div>
            <SaayaDownload source="safety-page" variant="compact" />
          </div>

          {/* Setup — inline 3 steps */}
          <div className="flex items-start gap-2 mb-1">
            <h3 className="font-semibold text-ink text-sm">Setup in 5 minutes:</h3>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {[
              { icon: "📲", title: "Install from source", detail: "Build APK from GitHub. Signed APK coming soon." },
              { icon: "⚙️", title: "Grant 5 permissions", detail: "App walks you through each one." },
              { icon: "▶️", title: "Enter number, tap Start", detail: "Runs quietly in the background." },
            ].map((s) => (
              <div key={s.title} className="bg-surface border border-border-subtle rounded-[10px] px-3 py-2.5 flex items-start gap-2.5">
                <span className="text-base mt-0.5">{s.icon}</span>
                <div>
                  <p className="font-medium text-ink text-xs">{s.title}</p>
                  <p className="text-ink-tertiary text-[11px] leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      <SafetyStickyBar />
    </main>
  );
}
