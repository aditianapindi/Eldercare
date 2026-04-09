"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import type { Parent, Checkin } from "@/lib/vault-types";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadData = async () => {
    const [p, c, s, r] = await Promise.all([
      authFetch("/api/vault/parents").then((r) => r.json()),
      authFetch("/api/vault/checkins").then((r) => r.json()),
      authFetch("/api/vault/parents/stats").then((r) => r.json()),
      authFetch("/api/vault/report").then((r) => r.json()).catch(() => null),
    ]);
    setParents(Array.isArray(p) ? p : []);
    setCheckins(Array.isArray(c) ? c : []);
    setStats(s && typeof s === "object" && !Array.isArray(s) ? s : {});
    setReport(r);
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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await authFetch("/api/vault/report/regenerate", { method: "POST" });
      if (res.ok) {
        const updated = await res.json();
        setReport(updated);
      }
    } finally {
      setRegenerating(false);
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
      <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink mb-1">
        Your Family
      </h1>
      <p className="text-ink-secondary text-sm md:text-base mb-4">
        Everything about your parents&apos; care, in one place.
      </p>

      {/* 1. Streak banner — most prominent */}
      {parents.length > 0 && (
        <StreakBanner
          parents={parents}
          checkins={checkins}
          today={today}
          onCheckin={handleCheckin}
        />
      )}

      {/* 2. Assessment — compact inline bar */}
      {report && report.id && (
        <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-[10px] px-4 py-2.5 mb-5">
          <div className="w-9 h-9 rounded-full border-2 border-sage bg-cream flex items-center justify-center shrink-0">
            <span className="font-[family-name:var(--font-display)] text-sm font-bold text-ink">{report.score}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink text-sm font-medium">Care Score: {report.score}/10</p>
            <p className="text-ink-tertiary text-xs truncate">
              {report.priorityActions?.length > 0 && `${report.priorityActions.length} action items`}
              {report.blindSpotCount > 0 && ` · ${report.blindSpotCount} areas to explore`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`/report/${report.id}`}
              className="px-3 py-1.5 bg-sage text-white text-xs font-medium rounded-full hover:opacity-90 transition-opacity"
            >
              Report
            </a>
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="p-1.5 text-sage hover:bg-sage-light rounded-full transition-colors disabled:opacity-50"
              title="Update report with vault data"
            >
              {regenerating ? (
                <div className="w-4 h-4 rounded-full border-2 border-sage border-t-transparent animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8C2 4.68629 4.68629 2 8 2C10.2822 2 12.2542 3.32458 13.2 5.25M14 8C14 11.3137 11.3137 14 8 14C5.71776 14 3.74584 12.6754 2.8 10.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M13 2.5V5.5H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 13.5V10.5H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
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

      {/* Getting Started checklist */}
      <GettingStarted stats={stats} parents={parents} report={report} />
    </div>
  );
}

/* ─── Streak banner ─── */

function StreakBanner({
  parents,
  checkins,
  today,
  onCheckin,
}: {
  parents: Parent[];
  checkins: Checkin[];
  today: string;
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
    <div className={`rounded-[14px] p-4 md:p-5 mb-6 transition-all ${
      checkedToday
        ? "bg-sage-light/40 border border-sage/20"
        : "bg-mustard-light/40 border border-mustard/20"
    }`}>
      {/* Top row: streak + message */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-2xl md:text-3xl ${overallStreak >= 7 ? "" : ""}`}>
          {overallStreak >= 7 ? "🔥" : overallStreak >= 3 ? "🌱" : checkedToday ? "🌿" : "💛"}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-display)] text-xl md:text-2xl font-bold text-ink">
              {overallStreak}
            </span>
            <span className="text-ink-secondary text-sm md:text-base font-medium">
              day streak
            </span>
          </div>
          <p className="text-ink-tertiary text-xs md:text-sm">{getMessage()}</p>
        </div>
      </div>

      {/* Weekly dots */}
      <div className="flex justify-between mb-4 px-1">
        {weekDays.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] md:text-xs text-ink-tertiary font-medium">{day.label}</span>
            <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all ${
              day.checked
                ? "bg-sage text-white"
                : day.isToday
                ? "border-2 border-sage/40 text-sage"
                : day.isFuture
                ? "bg-border-subtle/50 text-ink-tertiary"
                : "bg-border-subtle text-ink-tertiary"
            }`}>
              {day.checked ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : day.isToday ? (
                <span className="text-[11px] font-bold">?</span>
              ) : (
                <span className="text-[10px]">·</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-sage rounded-full transition-all"
            style={{ width: `${(daysThisWeek / 7) * 100}%` }}
          />
        </div>
        <span className="text-xs md:text-sm text-ink-tertiary font-medium shrink-0">
          {daysThisWeek}/7 this week
        </span>
      </div>

      {/* Check-in buttons per parent */}
      {!checkedToday && (
        <div className="flex flex-wrap gap-2">
          {parents.map((parent) => {
            const parentCheckedToday = checkins.some(
              (c) => c.parent_id === parent.id && c.checked_at === today
            );
            return (
              <button
                key={parent.id}
                onClick={() => !parentCheckedToday && onCheckin(parent.id)}
                disabled={parentCheckedToday}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-sm font-medium min-h-[44px] transition-all ${
                  parentCheckedToday
                    ? "bg-sage-light text-sage"
                    : "bg-sage text-white hover:opacity-90"
                }`}
              >
                {parentCheckedToday ? (
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
      )}
    </div>
  );
}

/* ─── Parent avatar ─── */

function ParentAvatar({ label }: { label: string }) {
  const lower = label.toLowerCase();
  const isFemale = ["mother", "mom", "grandmother", "grandma", "aunt", "maid"].some((w) => lower.includes(w));
  const isMale = ["father", "dad", "grandfather", "grandpa", "uncle"].some((w) => lower.includes(w));

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

/* ─── Helpers ─── */

/** Returns YYYY-MM-DD in the user's local timezone */
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
