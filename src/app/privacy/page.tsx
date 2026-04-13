import { Watermark } from "@/lib/watermark";
import { AuthHeaderLink, LogoWithAuthLink } from "@/lib/auth-widgets";

export const metadata = {
  title: "Privacy — Inaya",
  description: "How Inaya handles your family's data. Plain English, no legal boilerplate.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh relative overflow-hidden">
      <Watermark />

      <div className="relative px-6 pt-6 md:px-12 lg:px-24 md:pt-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <LogoWithAuthLink />
          <AuthHeaderLink />
        </header>

        <div className="max-w-[680px] pb-16">
          <h1 className="font-[family-name:var(--font-display)] text-[clamp(26px,5vw,36px)] leading-[1.2] font-light text-ink tracking-tight mb-3">
            Your data, plainly explained
          </h1>
          <p className="text-ink-secondary text-base leading-relaxed mb-10">
            No legal jargon. Here&apos;s exactly what we do with your family&apos;s information.
          </p>

          <div className="space-y-8">
            <Section title="What we collect">
              <ul className="list-disc list-outside ml-5 space-y-1.5 text-ink-secondary text-sm leading-relaxed">
                <li>Your email address or Google account name (to sign you in)</li>
                <li>Assessment answers (to generate your care report)</li>
                <li>Vault data you add — parents&apos; health details, doctors, medicines, documents, expenses</li>
                <li>Nothing else. No contacts, no location, no phone data, no browsing history.</li>
              </ul>
            </Section>

            <Section title="How we store it">
              <ul className="list-disc list-outside ml-5 space-y-1.5 text-ink-secondary text-sm leading-relaxed">
                <li>All data is stored on <strong className="text-ink font-medium">encrypted Supabase servers (Mumbai region)</strong>. Your data never leaves your control.</li>
                <li>Encrypted in transit (TLS) and at rest (AES-256)</li>
                <li>Row-level security (RLS) enforced at the database level — only you and family members you&apos;ve explicitly invited can access your vault</li>
                <li>We don&apos;t have a &quot;view all users&apos; data&quot; admin panel. The database enforces access rules, not our app code.</li>
              </ul>
            </Section>

            <Section title="Who can see your data">
              <ul className="list-disc list-outside ml-5 space-y-1.5 text-ink-secondary text-sm leading-relaxed">
                <li><strong className="text-ink font-medium">You</strong> — full access to everything in your vault</li>
                <li><strong className="text-ink font-medium">Family members you invite</strong> — they get access to the shared vault only after you send them an invite link</li>
                <li><strong className="text-ink font-medium">Nobody else</strong> — not us, not our hosting provider, not any third party</li>
                <li>Care reports can be shared via link. The report link contains only the assessment results — it does not expose vault data (doctors, medicines, documents, etc.)</li>
              </ul>
            </Section>

            <Section title="What we never do">
              <ul className="list-disc list-outside ml-5 space-y-1.5 text-ink-secondary text-sm leading-relaxed">
                <li><strong className="text-ink font-medium">Never sell</strong> your data. Not to insurers, hospitals, pharma companies, or anyone.</li>
                <li><strong className="text-ink font-medium">Never share</strong> your data with third parties for marketing or advertising.</li>
                <li><strong className="text-ink font-medium">Never train AI</strong> on your family&apos;s information.</li>
                <li><strong className="text-ink font-medium">Never contact</strong> your parents, doctors, or family members without your explicit action.</li>
                <li><strong className="text-ink font-medium">No ads</strong>, ever.</li>
              </ul>
            </Section>

            <Section title="Third-party services">
              <p className="text-ink-secondary text-sm leading-relaxed mb-2">
                We use a small number of services to run Inaya. Here&apos;s exactly what they are and what they can see:
              </p>
              <ul className="list-disc list-outside ml-5 space-y-1.5 text-ink-secondary text-sm leading-relaxed">
                <li><strong className="text-ink font-medium">Supabase</strong> (Mumbai region) — database and authentication. Stores your vault data with row-level security.</li>
                <li><strong className="text-ink font-medium">Google OAuth</strong> — if you sign in with Google, Google knows you have an Inaya account. They don&apos;t see any vault data.</li>
                <li><strong className="text-ink font-medium">Vercel</strong> — hosts the website. Sees web requests but not your stored data.</li>
              </ul>
              <p className="text-ink-secondary text-sm leading-relaxed mt-2">
                That&apos;s the full list. No analytics trackers, no ad pixels, no data brokers.
              </p>
            </Section>

            <Section title="Cookies">
              <p className="text-ink-secondary text-sm leading-relaxed">
                We use one cookie: your login session. That&apos;s it. No tracking cookies, no third-party cookies, no cookie consent banner needed because there&apos;s nothing to consent to.
              </p>
            </Section>

            <Section title="How to delete your data">
              <p className="text-ink-secondary text-sm leading-relaxed">
                You own your data. If you want everything deleted, tap the{" "}
                <strong className="text-ink font-medium">Feedback</strong> button
                on any page and tell us — we&apos;ll wipe your account and all
                associated data within 48 hours. No questions, no retention
                period, no &quot;we&apos;ll keep it for 30 days just in case.&quot;
              </p>
            </Section>

            <div className="pt-4 border-t border-border-subtle">
              <p className="text-ink-tertiary text-xs">
                Last updated: April 2026. We&apos;ll update this page if anything changes — no surprise policy shifts buried in emails.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-semibold text-ink text-base md:text-lg mb-2">{title}</h2>
      {children}
    </section>
  );
}
