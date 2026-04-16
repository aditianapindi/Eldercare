import Link from "next/link";
import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink, LogoWithAuthLink } from "@/lib/auth-widgets";
import { SaayaDownload } from "@/lib/saaya-download";
import { FraudguardStickyBar } from "./fraudguard-client";

export const metadata = {
  title: "Saaya — A companion app for scam calls | Inaya",
  description:
    "A small Android companion that catches scam calls in the moment a banking app opens. On-device only. No cloud. Built alongside Inaya.",
};

const RESPONSES = [
  {
    title: "A full-screen red warning",
    detail:
      "Hard to miss, with a 30-second countdown before it can be dismissed — so there's time to think.",
  },
  {
    title: "A Hindi voice alert on the speaker",
    detail:
      "Spoken out loud, audible to whoever is in the room, so the parent snaps out of the call.",
  },
  {
    title: "An SMS to the guardian — you",
    detail:
      "Sent instantly from the parent's own SIM. No internet, no account, no delay.",
  },
];


export default function SaayaPage() {
  return (
    <main className="min-h-dvh relative overflow-hidden pb-[120px] md:pb-[100px]">
      <Watermark />
      {/* Warm decorative background — same palette as /safety and home */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[200px] -right-[200px] w-[600px] h-[600px] rounded-full bg-sage/[0.06]" />
        <div className="absolute bottom-[10%] -left-[100px] w-[300px] h-[300px] rounded-full bg-mustard/[0.04]" />
      </div>

      <div className="relative px-6 pt-6 md:px-12 lg:px-24 md:pt-8">
        {/* Header — auth-aware */}
        <header className="mb-12 flex items-center justify-between gap-4">
          <LogoWithAuthLink />
          <div className="flex items-center gap-3 md:gap-4">
            <a
              href="https://github.com/OrangeAKA/saaya"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-ink-tertiary border border-border rounded-full hover:border-ink-tertiary transition-colors min-h-[36px]"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              GitHub
            </a>
            <AuthHeaderLink />
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <p className="text-ink-tertiary text-xs uppercase tracking-wide mb-3 font-semibold">
            Companion app, Saaya
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(32px,6vw,52px)] leading-[1.15] font-light text-ink tracking-tight mb-6">
            Saaya catches scam calls in the moment a{" "}
            <span className="text-terracotta font-normal">banking app opens</span>.
          </h1>
          <p className="text-xl text-ink-secondary leading-relaxed max-w-[620px] mb-6">
            A small Android companion for the parent&apos;s phone. It listens for the
            dangerous window in a phone scam — an unknown caller on the line while a
            banking, UPI or remote-access app is opened — and steps in before money
            moves.
          </p>
          <p className="text-ink-secondary text-[15px] md:text-base leading-relaxed max-w-[620px]">
            On-device only. No cloud. No account. Saved contacts are always skipped.
          </p>
        </section>

        {/* The insight — why this exists */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-4">
            The moment nobody else is watching.
          </h2>
          <p className="text-ink-secondary text-base md:text-lg leading-relaxed mb-4">
            Every other scam defense focuses on identifying the caller{" "}
            <em>before</em> the phone is picked up — caller ID, spam labels, voice AI.
            None of them watch what happens after.
          </p>
          <p className="text-ink-secondary text-base md:text-lg leading-relaxed">
            The dangerous moment in a phone scam is not the ring. It&apos;s when the
            victim opens a banking app while still on the call. That&apos;s the window
            where transfers happen. Saaya watches that window.
          </p>
        </section>

        {/* How it works — 3 responses */}
        <section className="max-w-[900px] mb-16 md:mb-24">
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-6 md:mb-8">
            When it triggers, three things happen at once.
          </h2>
          <div className="grid gap-4 md:gap-5 md:grid-cols-3">
            {RESPONSES.map((r, idx) => (
              <div
                key={r.title}
                className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6"
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-terracotta-light text-terracotta font-semibold text-xs font-[family-name:var(--font-display)] mb-3">
                  {idx + 1}
                </span>
                <h3 className="font-[family-name:var(--font-display)] text-lg md:text-xl font-medium text-ink leading-snug mb-2">
                  {r.title}
                </h3>
                <p className="text-ink-secondary text-[15px] leading-relaxed">
                  {r.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* What it watches */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-4">
            What it watches for.
          </h2>
          <p className="text-ink-secondary text-base md:text-lg leading-relaxed mb-5">
            Saaya has a built-in list of high-risk apps. Opening any of these
            while on an unknown call triggers the warning.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 md:gap-4">
            <WatchCategory
              label="UPI apps"
              items="Google Pay, Paytm, PhonePe, Amazon Pay, BHIM"
            />
            <WatchCategory
              label="Banking apps"
              items="SBI, HDFC, ICICI, Axis, Kotak"
            />
            <WatchCategory
              label="Remote access"
              items="AnyDesk, TeamViewer, Mobizen — highest risk for digital arrest scams"
            />
          </div>
        </section>

        {/* Download section */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <div className="bg-mustard-light/40 border border-mustard/20 rounded-[16px] p-6 md:p-8">
            <p className="text-mustard text-xs font-bold uppercase tracking-wide mb-2">
              Free · Open source · Android 8.0+
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-3">
              Get Saaya.
            </h2>
            <p className="text-ink-secondary text-base leading-relaxed mb-2">
              Download the APK and install it on your parent&apos;s phone.
            </p>
            <p className="text-ink-tertiary text-sm mb-5">
              Setup takes 5 minutes — grant permissions, enter your number, tap Start.
            </p>
            <div className="space-y-3">
              <SaayaDownload source="saaya-page" />
              <a
                href="https://github.com/OrangeAKA/saaya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-ink-tertiary text-sm hover:text-ink transition-colors"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </section>

        {/* Contextual navigation */}
        <section className="max-w-[760px] mb-12 md:mb-16 flex items-center justify-between gap-4 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sage font-medium text-base hover:gap-3 transition-all"
          >
            ← Back to Inaya
          </Link>
          <Link
            href="/safety"
            className="inline-flex items-center gap-2 text-ink-tertiary text-sm hover:text-ink transition-colors"
          >
            Read the safety guide →
          </Link>
        </section>
      </div>

      {/* Sticky bottom CTA — stays in the Saaya flow */}
      <FraudguardStickyBar />
    </main>
  );
}

function WatchCategory({ label, items }: { label: string; items: string }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[12px] p-4">
      <p className="text-xs font-semibold text-ink-tertiary uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className="text-ink text-sm md:text-[15px] leading-snug">{items}</p>
    </div>
  );
}
