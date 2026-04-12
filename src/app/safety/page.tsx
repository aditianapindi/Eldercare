import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink, LogoWithAuthLink } from "@/lib/auth-widgets";
import { SafetyHeroCTAs, SafetyStickyBar } from "./safety-client";

export const metadata = {
  title: "Family Safety — Protect your parents from scams | GetSukoon",
  description:
    "The 5 scams targeting Indian parents right now — and what to do if it happens. From GetSukoon, the family care vault.",
};

const SCAMS = [
  {
    name: "Digital arrest",
    how: "A fake CBI or RBI officer on a video call claims your parent's name is in a money laundering case and asks them to transfer to a \"safe account.\"",
    flag: "No real Indian agency arrests anyone over a video call. Ever.",
  },
  {
    name: "KYC update",
    how: "An SMS or call from \"your bank\" says KYC has expired and the account will be frozen in 24 hours — with a phishing link or an AnyDesk install.",
    flag: "Real banks never ask for OTP, PIN or remote screen access.",
  },
  {
    name: "Courier / FedEx",
    how: "A caller claims a package in your parent's name was found with contraband and transfers them to fake \"Mumbai customs\" or \"Mumbai police.\"",
    flag: "No courier company has authority to call anyone about contraband.",
  },
  {
    name: "Family emergency",
    how: "\"Aunty, your son met with an accident — please send money to this hospital.\" Sometimes uses a voice cloned from a few seconds of social audio.",
    flag: "Always call your child directly on their known number first.",
  },
  {
    name: "Lottery or refund",
    how: "\"You've won ₹25 lakh in KBC / an income tax refund / SBI rewards. Pay a small processing fee to claim.\"",
    flag: "You cannot win a lottery you didn't enter. Refunds never need processing fees.",
  },
];

export default function SafetyPage() {
  return (
    <main className="min-h-dvh relative overflow-hidden pb-[120px] md:pb-[100px]">
      <Watermark />
      {/* Warm decorative background — same palette as home */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-sage/[0.06]" />
        <div className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full bg-terracotta/[0.04]" />
      </div>

      <div className="relative px-6 pt-6 md:px-12 lg:px-24 md:pt-8">
        {/* Header — auth-aware */}
        <header className="mb-12 flex items-center justify-between gap-4">
          <LogoWithAuthLink />
          <AuthHeaderLink />
        </header>

        {/* Hero — soft story + product line + CTAs (fonts match /) */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(32px,6vw,52px)] leading-[1.15] font-light text-ink tracking-tight mb-6">
            A scam call cost my mother{" "}
            <span className="text-terracotta font-normal">₹1.5 lakh</span>. Here&apos;s
            what we wish we&apos;d known.
          </h1>
          <p className="text-xl text-ink-secondary leading-relaxed max-w-[620px] mb-10">
            GetSukoon is the family care vault that keeps your parents&apos; health,
            money and safety essentials in one place — for the whole family.
          </p>
          <SafetyHeroCTAs />

        </section>

        {/* Scam cards — 2-col grid, compressed */}
        <section id="scams" className="max-w-[900px] mb-16 md:mb-24 scroll-mt-6">
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-6 md:mb-8">
            The 5 scams targeting Indian parents right now.
          </h2>

          <div className="grid gap-4 md:gap-5 md:grid-cols-2">
            {SCAMS.map((scam, idx) => (
              <div
                key={scam.name}
                className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6"
              >
                <div className="flex items-center gap-3 mb-2.5">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-terracotta-light text-terracotta flex items-center justify-center font-semibold text-xs font-[family-name:var(--font-display)]">
                    {idx + 1}
                  </span>
                  <h3 className="font-[family-name:var(--font-display)] text-lg md:text-xl font-medium text-ink leading-snug">
                    {scam.name}
                  </h3>
                </div>
                <p className="text-ink-secondary text-[15px] leading-relaxed mb-3">
                  {scam.how}
                </p>
                <p className="text-ink text-[15px] leading-snug">
                  <span className="text-mustard font-semibold">Red flag — </span>
                  {scam.flag}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Helpline — single callout */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <div className="bg-surface border border-border-subtle rounded-[16px] p-6 md:p-8">
            <p className="text-ink-tertiary text-xs md:text-sm font-semibold uppercase tracking-wide mb-3">
              If it&apos;s already happened
            </p>
            <a
              href="tel:1930"
              className="inline-flex items-baseline gap-3 mb-3 group flex-wrap"
            >
              <span className="font-[family-name:var(--font-display)] text-5xl md:text-6xl font-medium text-terracotta group-hover:opacity-90 transition-opacity">
                1930
              </span>
              <span className="text-ink-secondary text-base md:text-lg">
                National Cybercrime Helpline
              </span>
            </a>
            <p className="text-ink-secondary text-base md:text-lg leading-relaxed">
              Call within the first hour — that&apos;s when accounts can still be frozen.
              Then file at{" "}
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sage font-medium underline underline-offset-4 decoration-sage/40 hover:decoration-sage transition-colors"
              >
                cybercrime.gov.in
              </a>
              . Government-run, 24×7, free.
            </p>
          </div>
        </section>

        {/* The companion app — folded from /fraudguard */}
        <section id="app" className="max-w-[900px] mb-16 md:mb-24 scroll-mt-6">
          <p className="text-ink-tertiary text-xs uppercase tracking-wide mb-3 font-semibold">
            The companion app
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-4">
            We built an app that catches these calls in real time.
          </h2>
          <p className="text-ink-secondary text-base md:text-lg leading-relaxed max-w-[620px] mb-8">
            A small Android companion for the parent&apos;s phone. It watches for the
            dangerous moment in a scam — an unknown caller on the line while a banking or
            UPI app is opened — and triggers three things at once:
          </p>

          <div className="grid gap-4 md:gap-5 md:grid-cols-3 mb-8">
            <div className="bg-surface border border-border-subtle rounded-[14px] p-5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-terracotta-light text-terracotta font-semibold text-xs font-[family-name:var(--font-display)] mb-3">1</span>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-ink leading-snug mb-2">
                A full-screen red warning
              </h3>
              <p className="text-ink-secondary text-[15px] leading-relaxed">
                Hard to miss, with a 30-second countdown — so there&apos;s time to think.
              </p>
            </div>
            <div className="bg-surface border border-border-subtle rounded-[14px] p-5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-terracotta-light text-terracotta font-semibold text-xs font-[family-name:var(--font-display)] mb-3">2</span>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-ink leading-snug mb-2">
                A Hindi voice alert
              </h3>
              <p className="text-ink-secondary text-[15px] leading-relaxed">
                Spoken on the speaker, audible to whoever is in the room.
              </p>
            </div>
            <div className="bg-surface border border-border-subtle rounded-[14px] p-5">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-terracotta-light text-terracotta font-semibold text-xs font-[family-name:var(--font-display)] mb-3">3</span>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-medium text-ink leading-snug mb-2">
                An SMS to you
              </h3>
              <p className="text-ink-secondary text-[15px] leading-relaxed">
                Sent instantly from the parent&apos;s SIM. No internet, no account, no delay.
              </p>
            </div>
          </div>

          {/* Developer beta callout */}
          <div className="bg-mustard-light/40 border border-mustard/20 rounded-[16px] p-6 md:p-8">
            <p className="text-mustard text-xs font-bold uppercase tracking-wide mb-2">Developer beta</p>
            <p className="text-ink-secondary text-base leading-relaxed mb-4">
              FraudGuard is open source and currently in developer beta. A signed APK
              for non-technical users is on the way.
            </p>
            <a
              href="https://github.com/orangeaka/fraud-guard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-ink text-cream text-base font-medium rounded-[10px] hover:opacity-90 transition-opacity min-h-[48px]"
            >
              View the source on GitHub →
            </a>
          </div>
        </section>

      </div>

      {/* Sticky bottom CTA bar — auth-aware */}
      <SafetyStickyBar />
    </main>
  );
}
