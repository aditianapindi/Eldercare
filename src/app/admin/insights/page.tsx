"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, Stat, Bar, Empty, PageShell } from "@/lib/ui";

const ADMIN_EMAILS = ["aditianapindi@gmail.com", "aditi@test.com", "ramyashree1227@gmail.com", "jiddu.aditya@gmail.com"];

interface InsightsData {
  signups: { total: number; byDay: Record<string, number>; emails: { email: string; date: string }[] };
  assessments: {
    total: number;
    unique: number;
    byDay: Record<string, number>;
    bySource: Record<string, number>;
    avgScore: number;
    careWorries: Record<string, number>;
  };
  pageViews: {
    total: number;
    uniqueVisitors: number;
    byPage: Record<string, number>;
    byDay: Record<string, number>;
    bySource: Record<string, number>;
  };
  reports: { total: number; byDay: Record<string, number> };
  checkins: { total: number; byDay: Record<string, number> };
  shares: { total: number; claimed: number; expired: number };
  waitlist: { waitlist: number; abha: number };
  funnel: {
    pageVisits: number;
    assessStarts: number;
    assessCompletes: number;
    reportViews: number;
    signups: number;
    vaultActions: number;
  };
  vault: {
    doctors: number;
    medicines: number;
    expenses: number;
    contacts: number;
    documents: number;
    assets: number;
  };
  github: {
    total: number;
    bySource: Record<string, number>;
  };
  feedback: {
    total: number;
    avgScore: number;
    byDay: Record<string, number>;
    comments: { score: number; comment: string; page: string; date: string }[];
  };
}

function DayTable({ data }: { data: Record<string, number> }) {
  const sorted = Object.entries(data).sort(([a], [b]) => b.localeCompare(a));
  if (sorted.length === 0) return <Empty />;
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      {sorted.slice(0, 14).map(([day, count]) => (
        <div key={day} className="flex justify-between text-sm">
          <span className="text-ink-tertiary">{day}</span>
          <span className="font-medium text-ink">{count}</span>
        </div>
      ))}
    </div>
  );
}

function SourceBars({ data, color }: { data: Record<string, number>; color?: "sage" | "terracotta" | "blue" | "mustard" }) {
  const sorted = Object.entries(data).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return <Empty />;
  const max = sorted[0][1];
  return (
    <div className="space-y-2">
      {sorted.map(([source, count]) => (
        <Bar key={source} value={count} max={max} label={source} color={color} />
      ))}
    </div>
  );
}

export default function InsightsPage() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authorized = ADMIN_EMAILS.includes(user?.email ?? "");

  useEffect(() => {
    if (authLoading) return;
    if (!authorized) {
      setLoading(false);
      return;
    }

    authFetch("/api/admin/insights")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [authLoading, authorized, authFetch]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-ink-secondary text-lg">Unauthorized</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-terracotta">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const f = data.funnel;
  const funnelMax = Math.max(f.pageVisits, 1);

  return (
    <PageShell title="Inaya Insights">
      {/* Funnel */}
      <Card title="Funnel">
        <div className="space-y-2">
          <Bar value={f.pageVisits} max={funnelMax} label="Page visits" />
          <Bar value={f.assessStarts} max={funnelMax} label="Assess starts" color="sage" />
          <Bar value={f.assessCompletes} max={funnelMax} label="Completed" color="sage" />
          <Bar value={f.reportViews} max={funnelMax} label="Report views" color="blue" />
          <Bar value={f.signups} max={funnelMax} label="Signups" color="terracotta" />
          <Bar value={f.vaultActions} max={funnelMax} label="Vault actions" color="mustard" />
        </div>
      </Card>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card title="Signups"><Stat label="Total users" value={data.signups.total} /></Card>
        <Card title="Assessments">
          <Stat label="Total" value={data.assessments.total} />
          <Stat label="Unique people" value={data.assessments.unique} />
        </Card>
        <Card title="Avg Score"><Stat label="Diagnostic" value={data.assessments.avgScore} /></Card>
        <Card title="Page Views">
          <Stat label="Total" value={data.pageViews.total} />
          <Stat label="Unique visitors" value={data.pageViews.uniqueVisitors} />
        </Card>
      </div>

      {/* User emails */}
      <Card title={`Signed-up Users (${data.signups.total})`}>
        {data.signups.emails.length === 0 ? (
          <Empty />
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {data.signups.emails.map((u, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-ink">{u.email}</span>
                <span className="text-ink-tertiary shrink-0 ml-4">{u.date}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Assessment Sources">
          <SourceBars data={data.assessments.bySource} color="sage" />
        </Card>
        <Card title="Traffic Sources">
          <SourceBars data={data.pageViews.bySource} color="blue" />
        </Card>
      </div>

      {/* Pages */}
      <Card title="Page Views by Page">
        <SourceBars data={data.pageViews.byPage} color="mustard" />
      </Card>

      {/* Care worries */}
      <Card title="Care Worries">
        <SourceBars data={data.assessments.careWorries} color="terracotta" />
      </Card>

      {/* Daily trends */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Signups / Day"><DayTable data={data.signups.byDay} /></Card>
        <Card title="Assessments / Day"><DayTable data={data.assessments.byDay} /></Card>
        <Card title="Page Views / Day"><DayTable data={data.pageViews.byDay} /></Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Reports / Day"><DayTable data={data.reports.byDay} /></Card>
        <Card title="Check-ins / Day"><DayTable data={data.checkins.byDay} /></Card>
        <Card title="Shares">
          <div className="space-y-2">
            <Stat label="Total sent" value={data.shares.total} />
            <Stat label="Claimed" value={data.shares.claimed} />
            <Stat label="Expired" value={data.shares.expired} />
          </div>
        </Card>
      </div>

      {/* Vault items */}
      <Card title="Vault Items">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat label="Doctors" value={data.vault.doctors} />
          <Stat label="Medicines" value={data.vault.medicines} />
          <Stat label="Expenses" value={data.vault.expenses} />
          <Stat label="Contacts" value={data.vault.contacts} />
          <Stat label="Documents" value={data.vault.documents} />
          <Stat label="Assets" value={data.vault.assets} />
        </div>
      </Card>

      {/* GitHub clicks */}
      <Card title={`GitHub Clicks (${data.github.total})`}>
        {data.github.total === 0 ? (
          <Empty />
        ) : (
          <SourceBars data={data.github.bySource} color="sage" />
        )}
      </Card>

      {/* Feedback */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card title="Feedback">
          <div className="space-y-2">
            <Stat label="Total responses" value={data.feedback.total} />
            <Stat label="Avg NPS score" value={data.feedback.avgScore} />
          </div>
        </Card>
        <Card title="Feedback / Day"><DayTable data={data.feedback.byDay} /></Card>
      </div>

      {data.feedback.comments.length > 0 && (
        <Card title={`Feedback Comments (${data.feedback.comments.length})`}>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.feedback.comments.map((c, i) => (
              <div key={i} className="border-b border-border-subtle pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    c.score >= 9 ? "bg-sage-light text-sage" :
                    c.score >= 7 ? "bg-mustard-light text-mustard" :
                    "bg-terracotta-light text-terracotta"
                  }`}>{c.score}</span>
                  <span className="text-ink-tertiary text-xs">{c.page}</span>
                  <span className="text-ink-tertiary text-xs ml-auto">{c.date}</span>
                </div>
                <p className="text-ink text-sm">{c.comment}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Waitlist */}
      <Card title="Waitlist">
        <div className="flex gap-8">
          <Stat label="Waitlist signups" value={data.waitlist.waitlist} />
          <Stat label="ABHA interest" value={data.waitlist.abha} />
        </div>
      </Card>
    </PageShell>
  );
}
