import Link from "next/link";
import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink, LogoWithAuthLink } from "@/lib/auth-widgets";
import { TrackedGitHubLink } from "@/lib/tracked-github-link";
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
            <Link
              href="/safety"
              className="text-ink-tertiary text-sm hover:text-ink transition-colors hidden sm:block"
            >
              ← Safety guide
            </Link>
            <TrackedGitHubLink />
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

        {/* Get the app + setup — combined compact */}
        <section className="max-w-[760px] mb-16 md:mb-24">
          <div className="bg-mustard-light/40 border border-mustard/20 rounded-[16px] p-6 md:p-8">
            <p className="text-mustard text-xs font-bold uppercase tracking-wide mb-2">
              Developer beta · Open source
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-light text-ink leading-tight mb-3">
              Get Saaya.
            </h2>
            <p className="text-ink-secondary text-base leading-relaxed mb-2">
              Build from source on GitHub. Signed APK for non-technical users coming soon.
            </p>
            <p className="text-ink-tertiary text-sm mb-5">
              Setup takes 5 minutes — grant permissions, enter your number, tap Start.
              Requires Android 8.0+.
            </p>
            <TrackedGitHubLink />
          </div>
        </section>

        {/* Back to safety guide */}
        <section className="max-w-[760px] mb-12 md:mb-16">
          <Link
            href="/safety"
            className="inline-flex items-center gap-2 text-sage font-medium text-base md:text-lg hover:gap-3 transition-all"
          >
            ← Back to the safety guide
          </Link>
        </section>
      </div>

      {/* Sticky bottom CTA bar — auth-aware */}
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
