"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import type { Parent, Checkin, UpcomingItem } from "@/lib/vault-types";
import { CityInput } from "@/lib/city-input";

type ParentStats = Record<string, { medicines: number; doctors: number; monthlyExpenses: number }>;

export default function VaultDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    }>
      <VaultDashboard />
    </Suspense>
  );
}

const CONDITIONS = ["Diabetes", "Blood pressure", "Heart condition", "Arthritis", "Respiratory", "Vision / hearing", "Memory / cognitive", "Thyroid", "Kidney"];

function VaultDashboard() {
  const { user, authFetch } = useAuth();
  const searchParams = useSearchParams();
  const [parents, setParents] = useState<Parent[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [stats, setStats] = useState<ParentStats>({});
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const loadData = async () => {
    const [p, c, s, r, u] = await Promise.all([
      authFetch("/api/vault/parents").then((r) => r.json()),
      authFetch("/api/vault/checkins").then((r) => r.json()),
      authFetch("/api/vault/parents/stats").then((r) => r.json()),
      authFetch("/api/vault/report").then((r) => r.json()).catch(() => null),
      authFetch("/api/vault/upcoming").then((r) => r.json()).catch(() => []),
    ]);
    setParents(Array.isArray(p) ? p : []);
    setCheckins(Array.isArray(c) ? c : []);
    setStats(s && typeof s === "object" && !Array.isArray(s) ? s : {});
    setReport(r);
    setUpcoming(Array.isArray(u) ? u : []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    const setup = async () => {
      if (searchParams.get("setup") === "true") {
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
        window.history.replaceState({}, "", "/vault");
      }
      await loadData();
    };
    setup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleAddParent = async (label: string) => {
    const res = await authFetch("/api/vault/parents", {
      method: "POST",
      body: JSON.stringify({ label }),
    });
    if (res.ok) {
      const p = await res.json();
      setParents((prev) => [...prev, p]);
      setShowAddForm(false);
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Parent>) => {
    const res = await authFetch("/api/vault/parents", {
      method: "PUT",
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setParents((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Remove ${label}? This can't be undone.`)) return;
    const res = await authFetch("/api/vault/parents", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) setParents((prev) => prev.filter((p) => p.id !== id));
  };

  const [regenStatus, setRegenStatus] = useState<string | null>(null);
  const handleRegenerate = async () => {
    setRegenerating(true);
    setRegenStatus(null);
    try {
      const res = await authFetch("/api/vault/report/regenerate", { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setReport(updated);
        setRegenStatus("Report updated!");
      } else {
        const err = await res.json().catch(() => ({}));
        setRegenStatus(`Failed: ${err.error || res.status}`);
      }
    } catch (e) {
      setRegenStatus(`Error: ${e}`);
    } finally {
      setRegenerating(false);
      setTimeout(() => setRegenStatus(null), 4000);
    }
  };

  const handleCheckin = async (parentId: string) => {
    const res = await authFetch("/api/vault/checkins", {
      method: "POST",
      body: JSON.stringify({ parent_id: parentId, date: today }),
    });
    if (res.ok) {
      const checkin = await res.json();
      setCheckins((prev) => [checkin, ...prev]);
    }
  };

  const today = localDate(new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
          Your Family
        </h1>
        <button
          onClick={() => setShowShareModal(true)}
          className="shrink-0 mt-1 inline-flex items-center gap-1.5 px-3 py-2 min-h-[36px] bg-surface border border-border-subtle hover:border-sage hover:text-sage text-ink-secondary text-xs md:text-sm font-medium rounded-full transition-colors"
          title="Share vault"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="4" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="4" r="1.8" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="12" r="1.8" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5.5 7L10.5 4.5M5.5 9L10.5 11.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Share
        </button>
      </div>
      <p className="text-ink-secondary text-sm md:text-base mb-4">
        Everything about your parents&apos; care, in one place.
      </p>

      {/* 1. Streak banner — most prominent */}
      {parents.length > 0 && (
        <StreakBanner
          parents={parents}
          checkins={checkins}
          today={today}
          currentUserId={user?.id}
          onCheckin={handleCheckin}
        />
      )}

      {/* 2. Assessment — compact inline bar */}
      {report && report.id && (
        <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-[10px] px-4 py-2.5 min-h-[48px] mb-5">
          <div className="w-9 h-9 rounded-full border-2 border-sage bg-cream flex items-center justify-center shrink-0">
            <span className="font-[family-name:var(--font-display)] text-sm font-bold text-ink">{report.score}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-medium">Care Score: {report.score}/10</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`/report/${report.id}`}
              className="px-3 h-[36px] bg-sage text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity inline-flex items-center justify-center"
            >
              View report
            </a>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="px-3 h-[36px] text-sage text-xs font-medium border border-sage/30 rounded-full hover:bg-sage-light transition-colors disabled:opacity-50 inline-flex items-center justify-center"
            >
              {regenerating ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      )}
      {!report && (
        <a href="/assess" className="flex items-center gap-3 bg-sage-light/50 border border-sage/20 rounded-[10px] px-4 py-2.5 mb-5 hover:bg-sage-light transition-colors">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-sage shrink-0">
            <path d="M4 16C4 16 6 10 12 6C12 6 14 4 16 4C16 4 16 8 14 12C10 14 4 16 4 16Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sage text-sm font-medium">Take the care assessment — 2 min</p>
        </a>
      )}

      {regenStatus && (
        <p className={`text-sm mb-3 ${regenStatus.startsWith("Report") ? "text-sage" : "text-terracotta"}`}>{regenStatus}</p>
      )}

      {/* 2b. Focus this week */}
      {report?.priorityActions?.length > 0 && (
        <WeeklyFocus actions={report.priorityActions} reportId={report.id} />
      )}

      {/* 3. Parent cards — 2-col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {parents.map((parent) => {
          const s = stats[parent.id] || { medicines: 0, doctors: 0, monthlyExpenses: 0 };
          const shared = stats["shared"] || { medicines: 0, doctors: 0, monthlyExpenses: 0 };

          if (editingId === parent.id) {
            return (
              <EditParentCard
                key={parent.id}
                parent={parent}
                onSave={(updates) => handleUpdate(parent.id, updates)}
                onCancel={() => setEditingId(null)}
              />
            );
          }

          return (
            <div key={parent.id} className="bg-surface border border-border-subtle rounded-[14px] p-4 md:p-5">
              {/* Header: avatar + name + actions */}
              <div className="flex items-center gap-3 mb-3">
                <ParentAvatar label={parent.label} />
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-ink text-base md:text-lg truncate">{parent.label}</h2>
                  <p className="text-xs md:text-sm text-ink-tertiary">
                    {[
                      parent.age && `Age ${parent.age}`,
                      parent.location,
                      parent.living_situation && parent.living_situation.replace(/-/g, " "),
                    ].filter(Boolean).join(" · ") || "Tap edit to add details"}
                  </p>
                </div>
                <button
                  onClick={() => setEditingId(parent.id)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-tertiary hover:bg-sand transition-colors shrink-0"
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(parent.id, parent.label)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-ink-tertiary hover:bg-terracotta-light hover:text-terracotta transition-colors shrink-0"
                  title="Remove"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              {/* Conditions */}
              {parent.conditions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {parent.conditions.map((c) => (
                    <span key={c} className="px-2 py-0.5 bg-sage-light text-sage text-[11px] md:text-xs font-medium rounded-full">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats row */}
              {(s.medicines > 0 || s.doctors > 0 || s.monthlyExpenses > 0 || shared.monthlyExpenses > 0) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {s.medicines > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sage-light/60 rounded-full text-[11px] md:text-xs font-medium text-sage">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="18" rx="4" stroke="currentColor" strokeWidth="2" /><path d="M6 11H18" stroke="currentColor" strokeWidth="2" /></svg>
                      {s.medicines} medicine{s.medicines !== 1 ? "s" : ""}
                    </span>
                  )}
                  {s.doctors > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-light/60 rounded-full text-[11px] md:text-xs font-medium text-blue">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="2" /><path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                      {s.doctors} doctor{s.doctors !== 1 ? "s" : ""}
                    </span>
                  )}
                  {(s.monthlyExpenses > 0 || shared.monthlyExpenses > 0) && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mustard-light/60 rounded-full text-[11px] md:text-xs font-medium text-mustard">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M3 11H21" stroke="currentColor" strokeWidth="2" /></svg>
                      ₹{Math.round(s.monthlyExpenses + shared.monthlyExpenses / Math.max(parents.length, 1)).toLocaleString("en-IN")}/mo
                    </span>
                  )}
                </div>
              )}

            </div>
          );
        })}

        {/* Empty state */}
        {parents.length === 0 && (
          <div className="bg-surface border border-border-subtle rounded-[14px] p-6 text-center col-span-full">
            <p className="text-ink-secondary text-sm md:text-base mb-4">
              No parent profiles yet. Take the{" "}
              <a href="/assess" className="text-sage underline">assessment</a>{" "}
              to get started, or add one manually.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-5 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity"
            >
              + Add a parent or dependent
            </button>
          </div>
        )}
      </div>

      {/* Add dependent */}
      {parents.length > 0 && !showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-border text-ink-tertiary font-medium rounded-[12px] text-sm min-h-[48px] hover:border-sage hover:text-sage transition-colors mb-8"
        >
          + Add parent, in-law, or dependent
        </button>
      )}
      {showAddForm && (
        <div className="mb-8">
          <AddDependentForm onSubmit={handleAddParent} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* What's coming up + Safety */}
      <div className={`grid gap-4 mb-8 ${upcoming.length > 0 ? "md:grid-cols-[1fr_auto]" : ""}`}>
        {upcoming.length > 0 && <UpcomingCard items={upcoming} />}
        <SafetyCard hasUpcoming={upcoming.length > 0} />
      </div>

      {/* Getting Started checklist */}
      <GettingStarted stats={stats} parents={parents} report={report} />

      {/* Share vault modal */}
      {showShareModal && <ShareModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}

/* ─── Weekly focus ─── */

function WeeklyFocus({ actions, reportId }: { actions: { title: string; description: string; urgency: string }[]; reportId: string }) {
  const storageKey = `focus_done_${reportId}`;
  const [completedIds, setCompletedIds] = useState<number[]>([]);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setCompletedIds(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  const remaining = actions.map((a, i) => ({ ...a, idx: i })).filter((a) => !completedIds.includes(a.idx));

  if (remaining.length === 0) {
    return (
      <div className="mb-5 bg-sage-light/50 border border-sage/20 rounded-[12px] px-4 py-3 text-center">
        <p className="text-sage text-sm font-medium">All steps completed — you&apos;re ahead of most families.</p>
      </div>
    );
  }

  // Pick based on week number, cycling through remaining
  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const current = remaining[weekNum % remaining.length];

  const handleDone = () => {
    const updated = [...completedIds, current.idx];
    setCompletedIds(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setJustCompleted(true);
    setTimeout(() => setJustCompleted(false), 2000);
  };

  return (
    <div className="mb-5">
      <p className="text-xs text-ink-tertiary uppercase tracking-wide mb-2">Your focus this week</p>
      <div className="bg-surface border border-border-subtle rounded-[12px] p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-sage text-white font-semibold text-sm flex items-center justify-center shrink-0 mt-0.5">
            {current.idx + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-ink text-sm md:text-base mb-1">{current.title}</p>
            <p className="text-ink-secondary text-sm leading-relaxed">{current.description}</p>
            <button
              onClick={handleDone}
              className="mt-3 px-4 py-2 min-h-[36px] text-sm font-medium rounded-full transition-colors bg-sage-light text-sage hover:bg-sage hover:text-white"
            >
              {justCompleted ? "Nice work!" : "Done"}
            </button>
            {remaining.length > 1 && (
              <p className="text-ink-tertiary text-[11px] mt-2">{remaining.length - 1} more step{remaining.length - 1 > 1 ? "s" : ""} after this</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Streak banner ─── */

function StreakBanner({
  parents,
  checkins,
  today,
  currentUserId,
  onCheckin,
}: {
  parents: Parent[];
  checkins: Checkin[];
  today: string;
  currentUserId: string | undefined;
  onCheckin: (parentId: string) => void;
}) {
  // Calculate overall streak (checked on ANY parent counts as a day)
  const allDates = [...new Set(checkins.map((c) => c.checked_at))].sort().reverse();
  let overallStreak = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = localDate(d);
    if (allDates.includes(ds)) {
      overallStreak++;
    } else if (i === 0) {
      continue; // today not checked yet is ok
    } else {
      break;
    }
  }

  // Longest streak — scan the full 60-day window for the longest consecutive run
  let longestStreak = 0;
  let runningStreak = 0;
  for (let i = 59; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = localDate(d);
    if (allDates.includes(ds)) {
      runningStreak++;
      if (runningStreak > longestStreak) longestStreak = runningStreak;
    } else {
      runningStreak = 0;
    }
  }

  // Weekly view (Mon-Sun) using local dates
  const weekDays = [];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ds = localDate(d);
    const isToday = ds === today;
    const isFuture = ds > today;
    const checked = allDates.includes(ds);
    weekDays.push({ label: dayLabels[i], date: ds, isToday, isFuture, checked });
  }

  const checkedToday = allDates.includes(today);
  const daysThisWeek = weekDays.filter((d) => d.checked).length;

  // Milestone messages
  const getMessage = () => {
    if (!checkedToday) return "Check in with your parents today";
    if (overallStreak >= 30) return "30 days! Your parents are lucky to have you";
    if (overallStreak >= 14) return "Two weeks strong! This is becoming a habit";
    if (overallStreak >= 7) return "A full week! You're building something meaningful";
    if (overallStreak >= 3) return "Keep it going! Consistency matters";
    return "Great job checking in today";
  };

  return (
    <div className={`rounded-[14px] p-3 md:p-4 mb-6 transition-all ${
      checkedToday
        ? "bg-sage-light/40 border border-sage/20"
        : "bg-mustard-light/40 border border-mustard/20"
    }`}>
      {/* Top row: streak + dots inline */}
      <div className="flex items-center gap-3 mb-2.5">
        <div className="text-xl">
          {overallStreak >= 7 ? "🔥" : overallStreak >= 3 ? "🌱" : checkedToday ? "🌿" : "💛"}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-[family-name:var(--font-display)] text-lg md:text-xl font-bold text-ink">
            {overallStreak}
          </span>
          <span className="text-ink-secondary text-sm font-medium">
            day streak
          </span>
          {longestStreak > overallStreak && longestStreak >= 3 && (
            <span className="text-ink-tertiary text-xs">
              · best {longestStreak}
            </span>
          )}
        </div>
        <span className="ml-auto text-ink-tertiary text-xs font-medium">
          {daysThisWeek}/7
        </span>
      </div>

      {/* Weekly dots — compact */}
      <div className="flex justify-between mb-2.5 px-0.5">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[9px] md:text-[10px] text-ink-tertiary font-medium">{day.label}</span>
            <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all ${
              day.checked
                ? "bg-sage text-white"
                : day.isToday
                ? "border-2 border-sage/40 text-sage"
                : day.isFuture
                ? "bg-border-subtle/50 text-ink-tertiary"
                : "bg-border-subtle text-ink-tertiary"
            }`}>
              {day.checked ? (
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : day.isToday ? (
                <span className="text-[10px] font-bold">?</span>
              ) : (
                <span className="text-[9px]">·</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Past weeks — compact 4-week heatmap */}
      {(() => {
        // Build 4 previous weeks (not including current week)
        const pastWeeks: { label: string; days: { date: string; checked: boolean }[] }[] = [];
        for (let w = 1; w <= 4; w++) {
          const weekStart = new Date(monday);
          weekStart.setDate(monday.getDate() - w * 7);
          const days: { date: string; checked: boolean }[] = [];
          for (let d = 0; d < 7; d++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + d);
            const ds = localDate(day);
            days.push({ date: ds, checked: allDates.includes(ds) });
          }
          const checkedCount = days.filter((d) => d.checked).length;
          if (checkedCount === 0 && w > 1) continue; // skip empty old weeks
          const startLabel = weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          pastWeeks.push({ label: startLabel, days });
        }
        if (pastWeeks.length === 0) return null;
        return (
          <div className="mb-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] text-ink-tertiary font-medium">Previous weeks</span>
            </div>
            <div className="space-y-1">
              {pastWeeks.map((week) => (
                <div key={week.label} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-ink-tertiary w-[42px] shrink-0">{week.label}</span>
                  <div className="flex gap-[3px]">
                    {week.days.map((d, i) => (
                      <div
                        key={i}
                        className={`w-3.5 h-3.5 rounded-sm ${
                          d.checked ? "bg-sage/70" : "bg-border-subtle/60"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[9px] text-ink-tertiary ml-1">{week.days.filter((d) => d.checked).length}/7</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Check-in buttons per parent */}
      <div className="flex flex-wrap gap-2">
        {parents.map((parent) => {
          const iCheckedThisParent = checkins.some(
            (c) => c.parent_id === parent.id && c.checked_at === today && c.checked_in_by === currentUserId
          );
          const someoneElseChecked = !iCheckedThisParent && checkins.some(
            (c) => c.parent_id === parent.id && c.checked_at === today
          );
          return (
            <button
              key={parent.id}
              onClick={() => !iCheckedThisParent && onCheckin(parent.id)}
              disabled={iCheckedThisParent}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium min-h-[44px] transition-all ${
                iCheckedThisParent
                  ? "bg-sage-light text-sage cursor-default"
                  : someoneElseChecked
                  ? "bg-white border-2 border-sage text-sage hover:bg-sage-light"
                  : "bg-sage text-white hover:opacity-90"
              }`}
              title={someoneElseChecked ? "Family already checked in — you can too" : undefined}
            >
              {iCheckedThisParent ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {parent.label}
                </>
              ) : (
                `Check in on ${parent.label}`
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Parent avatar ─── */

function ParentAvatar({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const isFemale = ["mother", "mom", "mummy", "amma", "grandmother", "grandma", "nani", "dadi", "aunt", "maid"].some((w) => lower.includes(w));
  const isMale = ["father", "dad", "daddy", "papa", "appa", "grandfather", "grandpa", "nana", "dada", "uncle"].some((w) => lower.includes(w));

  return (
    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-sage-light flex items-center justify-center shrink-0">
      {isFemale ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage">
          <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 18C3.5 14.5 6 12 10 12C14 12 16.5 14.5 16.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M7 6C7 3.5 8.5 1 10 1C11.5 1 13 3.5 13 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      ) : isMale ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage">
          <circle cx="10" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 18C3.5 14.5 6 12 10 12C14 12 16.5 14.5 16.5 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-sage">
          <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 17C4 14.2 6.7 12 10 12C13.3 12 16 14.2 16 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </div>
  );
}


/* ─── Inline edit card ─── */

function EditParentCard({
  parent,
  onSave,
  onCancel,
}: {
  parent: Parent;
  onSave: (updates: Partial<Parent>) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(parent.label);
  const [age, setAge] = useState(parent.age?.toString() || "");
  const [location, setLocation] = useState(parent.location || "");
  const [living, setLiving] = useState(parent.living_situation || "");
  const [conditions, setConditions] = useState<string[]>(parent.conditions || []);

  const toggleCondition = (c: string) => {
    setConditions((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  };

  return (
    <div className="bg-surface border-2 border-sage rounded-[14px] p-4 md:p-5 animate-[fadeIn_0.2s_ease] col-span-1">
      <div className="flex items-center gap-3 mb-4">
        <ParentAvatar label={label} />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 px-3 py-2 border-2 border-border rounded-[8px] text-ink font-semibold text-base bg-white focus:border-sage focus:outline-none"
          placeholder="Name"
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Age"
          className="px-3 py-2 border-2 border-border rounded-[8px] text-ink text-sm bg-white focus:border-sage focus:outline-none min-h-[40px]"
        />
        <CityInput
          value={location}
          onChange={setLocation}
          placeholder="City"
          className="px-3 py-2 border-2 border-border rounded-[8px] text-ink text-sm bg-white focus:border-sage focus:outline-none min-h-[40px]"
        />
      </div>

      {/* Living situation */}
      <p className="text-ink-tertiary text-xs font-medium mb-1.5">Living situation</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {[
          { label: "Alone", value: "alone" },
          { label: "Together", value: "together" },
          { label: "With child", value: "with-child" },
          { label: "Assisted", value: "assisted" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setLiving(living === opt.value ? "" : opt.value)}
            className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[30px] ${
              living === opt.value
                ? "bg-sage text-white border-sage"
                : "bg-white border-border text-ink-secondary hover:border-sage/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Health conditions */}
      <p className="text-ink-tertiary text-xs font-medium mb-1.5">Health conditions</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggleCondition(c)}
            className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[30px] ${
              conditions.includes(c)
                ? "bg-sage text-white border-sage"
                : "bg-white border-border text-ink-secondary hover:border-sage/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() =>
            onSave({
              label: label.trim() || parent.label,
              age: age ? parseInt(age) : null,
              location: location.trim() || null,
              living_situation: living || null,
              conditions,
            })
          }
          className="px-5 py-2.5 bg-sage text-white font-medium rounded-[8px] text-sm min-h-[40px] hover:opacity-90 transition-opacity"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 text-ink-secondary font-medium rounded-[8px] text-sm min-h-[40px] hover:bg-sand transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Add dependent form ─── */

/* ─── Getting Started checklist ─── */

function GettingStarted({
  stats,
  parents,
  report,
}: {
  stats: ParentStats;
  parents: Parent[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report: any;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (stats as any)["_meta"] || {};

  const steps = [
    {
      label: "Take the care assessment",
      done: !!report?.id,
      href: report?.id ? `/report/${report.id}` : "/assess",
    },
    {
      label: "Name your parents",
      done: parents.some((p) => !p.label.startsWith("Parent")),
      href: "/vault",
    },
    {
      label: "Add their first doctor",
      done: (meta.doctors || 0) > 0,
      href: "/vault/doctors",
    },
    {
      label: "Add one medicine",
      done: (meta.medicines || 0) > 0,
      href: "/vault/medicines",
    },
    {
      label: "Add an emergency contact",
      done: (meta.emergencyContacts || 0) > 0,
      href: "/vault/contacts",
    },
    {
      label: "List one financial asset",
      done: (meta.totalAssets || 0) > 0,
      href: "/vault/assets",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  if (allDone) {
    return (
      <div className="mt-2 bg-sage-light/40 border border-sage/20 rounded-[14px] p-5 text-center">
        <span className="text-2xl mb-2 block">🎉</span>
        <p className="font-[family-name:var(--font-display)] text-lg font-medium text-ink mb-1">
          You&apos;re all set up!
        </p>
        <p className="text-ink-secondary text-sm">
          Your Family Vault is ready. Keep it updated as things change — and don&apos;t forget to check in daily.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-3">
        <p className="text-ink-tertiary text-sm font-medium uppercase tracking-wide">Getting started</p>
        <span className="text-xs md:text-sm text-ink-tertiary">{doneCount}/{steps.length}</span>
      </div>
      {/* Progress bar */}
      <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-sage rounded-full transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-1">
        {steps.map((step) => (
          <a
            key={step.label}
            href={step.href}
            className={`flex items-center gap-3 py-2.5 px-3 rounded-[10px] transition-colors ${
              step.done ? "opacity-60" : "hover:bg-sand"
            }`}
          >
            {step.done ? (
              <span className="w-5 h-5 rounded-full bg-sage flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            ) : (
              <span className="w-5 h-5 rounded-full border-2 border-border shrink-0" />
            )}
            <span className={`text-sm md:text-base ${step.done ? "text-ink-tertiary line-through" : "text-ink font-medium"}`}>
              {step.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function AddDependentForm({ onSubmit, onCancel }: { onSubmit: (label: string) => void; onCancel: () => void }) {
  const [label, setLabel] = useState("");
  const presets = ["Mother", "Father", "Mother-in-law", "Father-in-law", "Grandmother", "Grandfather", "Uncle", "Aunt"];

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-3">Who are you adding?</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setLabel(p)}
            className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
              label === p ? "bg-sage text-white border-sage" : "bg-white border-border text-ink-secondary hover:border-sage/50"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Or type a custom name..."
        className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px] mb-4"
      />
      <div className="flex gap-3">
        <button
          onClick={() => label.trim() && onSubmit(label.trim())}
          disabled={!label.trim()}
          className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Add
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-3 text-ink-secondary font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:bg-sand transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Upcoming card ─── */

function UpcomingCard({ items }: { items: UpcomingItem[] }) {
  const top = items.slice(0, 5);

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-sage">
            <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 8H17" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 2V6M13 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h3 className="font-semibold text-ink text-sm md:text-base">What&apos;s coming up</h3>
        </div>
        {items.length > 5 && (
          <span className="text-xs text-ink-tertiary">{items.length} total</span>
        )}
      </div>

      <div className="space-y-1">
        {top.map((item, idx) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 py-2.5 ${
              idx !== top.length - 1 ? "border-b border-border-subtle/60" : ""
            }`}
          >
            <UpcomingIcon kind={item.kind} />
            <div className="flex-1 min-w-0">
              <p className="text-ink text-sm font-medium truncate">{item.title}</p>
              <p className="text-ink-tertiary text-xs truncate">
                {item.parent_label}
                {item.subtitle && <> · {item.subtitle}</>}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-ink-secondary text-xs font-medium">{relativeDate(item.date)}</p>
              <p className="text-ink-tertiary text-[10px]">{formatShortDate(item.date)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Safety card ─── */

function SafetyCard({ hasUpcoming }: { hasUpcoming: boolean }) {
  return (
    <Link
      href="/safety"
      className={`group block bg-gradient-to-br from-mustard-light/50 to-sage-light/40 border border-mustard/20 rounded-[14px] p-4 md:p-5 hover:border-mustard/40 hover:shadow-sm transition-all relative overflow-hidden ${
        hasUpcoming ? "md:w-[260px] lg:w-[280px]" : ""
      }`}
    >
      <div className="absolute -top-3 -right-3 opacity-15">
        <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
          <path
            d="M35 8L52 18V34C52 47 43 56 35 60C27 56 18 47 18 34V18L35 8Z"
            stroke="#C9A14A"
            strokeWidth="2.5"
            strokeLinejoin="round"
            fill="#C9A14A"
            fillOpacity="0.2"
          />
        </svg>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-mustard-light flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className="text-mustard">
              <path
                d="M10 2L16 5V10C16 14 13.5 17 10 18C6.5 17 4 14 4 10V5L10 2Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="font-semibold text-ink text-sm md:text-base">Family safety</h3>
        </div>
        <p className="text-ink-secondary text-xs md:text-[13px] leading-snug mb-3">
          ₹22,495 Cr lost to scams in 2025. The 5 scams targeting parents
          right now — and how to stop them.
        </p>
        <span className="inline-flex items-center gap-1 text-mustard text-xs md:text-sm font-medium group-hover:gap-1.5 transition-all">
          Get safety setup →
        </span>
      </div>
    </Link>
  );
}

function UpcomingIcon({ kind }: { kind: UpcomingItem["kind"] }) {
  const common = "w-8 h-8 rounded-full flex items-center justify-center shrink-0";
  if (kind === "appointment") {
    return (
      <div className={`${common} bg-blue-light text-blue`}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <rect x="4" y="2" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 7V13M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }
  if (kind === "renewal") {
    return (
      <div className={`${common} bg-mustard-light text-mustard`}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path d="M3 10C3 6.13 6.13 3 10 3C12.76 3 15.14 4.63 16.26 7M17 10C17 13.87 13.87 17 10 17C7.24 17 4.86 15.37 3.74 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M16 3V7H12M4 17V13H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div className={`${common} bg-sage-light text-sage`}>
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
        <rect x="6" y="3" width="8" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function relativeDate(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const then = new Date(iso + "T00:00:00");
  const diff = Math.round((then.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 7) return `in ${diff} days`;
  if (diff < 14) return "next week";
  if (diff < 30) return `in ${Math.round(diff / 7)} weeks`;
  if (diff < 60) return "next month";
  return `in ${Math.round(diff / 30)} months`;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ─── Share modal ─── */

interface ShareInvite {
  id: string;
  token: string;
  label: string | null;
  role: string;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
  claimed_by: string | null;
  revoked_at: string | null;
}

interface VaultMember {
  id: string;
  member_user_id: string;
  invite_label: string | null; // the label the owner set on the share they claimed
  role: string;
  created_at: string;
}

function ShareModal({ onClose }: { onClose: () => void }) {
  const { authFetch } = useAuth();
  const [shares, setShares] = useState<ShareInvite[]>([]);
  const [members, setMembers] = useState<VaultMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await authFetch("/api/vault/shares");
      const data = await res.json();
      setShares(Array.isArray(data.shares) ? data.shares : []);
      setMembers(Array.isArray(data.members) ? data.members : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await authFetch("/api/vault/shares", {
        method: "POST",
        body: JSON.stringify({ label: newLabel || null }),
      });
      if (res.ok) {
        const invite = await res.json();
        setShares((prev) => [invite, ...prev]);
        setNewLabel("");
        // auto-copy the freshly-created link
        const url = `${window.location.origin}/join?token=${invite.token}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopiedToken(invite.token);
        setTimeout(() => setCopiedToken(null), 2000);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (token: string) => {
    const url = `${window.location.origin}/join?token=${token}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this invite? The link will stop working immediately.")) return;
    const res = await authFetch("/api/vault/shares", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) setShares((prev) => prev.filter((s) => s.id !== id));
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Remove this member? They'll lose access immediately.")) return;
    const res = await authFetch("/api/vault/shares", {
      method: "DELETE",
      body: JSON.stringify({ id, type: "member" }),
    });
    if (res.ok) setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const activeShares = shares.filter((s) => !s.claimed_at && !s.revoked_at && new Date(s.expires_at) > new Date());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-cream border border-border-subtle rounded-[18px] w-full max-w-[480px] max-h-[85dvh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-cream/95 backdrop-blur border-b border-border-subtle px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-medium text-ink">Share vault</h2>
            <p className="text-ink-tertiary text-xs">Invite a sibling or partner to co-manage</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-tertiary hover:bg-sand transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {/* Create new invite */}
          <div className="mb-6">
            <label className="block text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-2">
              Invite label (optional)
            </label>
            <div className="flex gap-2">
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Brother Ravi"
                maxLength={60}
                className="flex-1 px-3 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px]"
              />
              <button
                onClick={handleCreate}
                disabled={creating}
                className="px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
              >
                {creating ? "…" : "Create link"}
              </button>
            </div>
            <p className="text-ink-tertiary text-xs mt-2">Single-use. Expires in 48 hours.</p>
            {newLabel.trim() === "" && (
              <p className="text-mustard text-xs mt-1.5">
                Tip: add a label so you can tell members apart later
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin" />
            </div>
          ) : (
            <>
              {/* Active members */}
              {members.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-2">
                    Members ({members.length})
                  </p>
                  <div className="space-y-1.5">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 bg-sage-light/40 border border-sage/15 rounded-[10px] min-h-[44px]"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-sage text-white flex items-center justify-center shrink-0">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M3 14C3 11.8 5.2 10 8 10C10.8 10 13 11.8 13 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-ink text-sm font-medium truncate">
                              {m.invite_label || "Member"}
                            </p>
                            <p className="text-ink-tertiary text-[11px]">
                              Editor · joined {new Date(m.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="text-ink-tertiary hover:text-terracotta text-xs font-medium px-2 py-1 rounded hover:bg-terracotta-light transition-colors shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active invites */}
              {activeShares.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-2">
                    Pending invites ({activeShares.length})
                  </p>
                  <div className="space-y-1.5">
                    {activeShares.map((s) => (
                      <div
                        key={s.id}
                        className="px-3 py-2.5 bg-surface border border-border-subtle rounded-[10px]"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-ink text-sm font-medium truncate">
                            {s.label || "Unlabeled invite"}
                          </span>
                          <button
                            onClick={() => handleRevoke(s.id)}
                            className="text-ink-tertiary hover:text-terracotta text-xs font-medium shrink-0"
                          >
                            Revoke
                          </button>
                        </div>
                        <button
                          onClick={() => handleCopy(s.token)}
                          className="w-full text-left px-2.5 py-2 bg-cream border border-border-subtle rounded-[8px] text-xs text-ink-secondary hover:border-sage hover:text-sage transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="truncate font-mono">
                            /join?token={s.token.slice(0, 10)}…
                          </span>
                          <span className="shrink-0 font-medium">
                            {copiedToken === s.token ? "Copied" : "Copy link"}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {members.length === 0 && activeShares.length === 0 && (
                <div className="text-center py-4 text-ink-tertiary text-sm">
                  No shares yet. Create a link above to invite a family member.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

/** Returns YYYY-MM-DD in the user's local timezone */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
