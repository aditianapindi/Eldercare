"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function VaultLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-sage border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!user) return null;

  const tabs = [
    { href: "/vault", label: "Home", icon: HomeIcon, exact: true },
    { href: "/vault/doctors", label: "Doctors", icon: DoctorIcon },
    { href: "/vault/medicines", label: "Health", icon: HealthIcon },
    { href: "/vault/expenses", label: "Expenses", icon: ExpenseIcon },
    { href: "/vault/assets", label: "Assets", icon: AssetIcon },
    { href: "/vault/contacts", label: "Contacts", icon: ContactIcon },
  ];

  return (
    <div className="min-h-dvh pb-[80px] md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-md border-b border-border-subtle px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-sage">
            <path d="M4 16C4 16 6 10 12 6C12 6 14 4 16 4C16 4 16 8 14 12C10 14 4 16 4 16Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 10L4 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className="text-sm tracking-wide text-ink-tertiary uppercase">GetSukoon</span>
        </div>
        <UserMenu />
      </header>

      {/* Desktop sidebar + mobile bottom tabs */}
      <div className="md:flex">
        {/* Desktop sidebar */}
        <nav className="hidden md:flex flex-col w-[220px] border-r border-border-subtle p-4 gap-1 sticky top-[53px] h-[calc(100dvh-53px)]">
          {tabs.map((tab) => {
            const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? "bg-sage-light text-sage" : "text-ink-secondary hover:bg-sand"
                }`}
              >
                <tab.icon active={active} />
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="flex-1 px-6 py-6 md:px-12 lg:px-16 max-w-[900px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-cream/95 backdrop-blur-md border-t border-border-subtle flex">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 min-h-[56px] transition-colors ${
                active ? "text-sage" : "text-ink-tertiary"
              }`}
            >
              <tab.icon active={active} />
              <span className="text-[11px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <button
      onClick={async () => {
        await signOut();
        router.replace("/");
      }}
      className="text-xs text-ink-tertiary hover:text-ink transition-colors px-3 py-1.5 rounded-lg hover:bg-sand"
      title={user?.email || ""}
    >
      Sign out
    </button>
  );
}

/* ─── Tab icons ─── */

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-sage" : "text-ink-tertiary"}>
      <path d="M3 8L10 3L17 8V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V8Z" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} strokeLinejoin="round" />
      <path d="M8 17V12H12V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DoctorIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-sage" : "text-ink-tertiary"}>
      <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} />
      <path d="M10 7V13M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function HealthIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-sage" : "text-ink-tertiary"}>
      <path d="M10 17S3 12.5 3 7.5C3 5 5 3 7.5 3C8.8 3 9.8 3.6 10 4.5C10.2 3.6 11.2 3 12.5 3C15 3 17 5 17 7.5C17 12.5 10 17 10 17Z" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} strokeLinejoin="round" />
      <path d="M10 8V12M8 10H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExpenseIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-sage" : "text-ink-tertiary"}>
      <rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} />
      <path d="M3 9H17" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 13H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AssetIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-sage" : "text-ink-tertiary"}>
      <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} />
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ContactIcon({ active }: { active: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={active ? "text-sage" : "text-ink-tertiary"}>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill={active ? "currentColor" : "none"} fillOpacity={active ? "0.12" : "0"} />
      <path d="M4 17C4 14.2386 6.68629 12 10 12C13.3137 12 16 14.2386 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
