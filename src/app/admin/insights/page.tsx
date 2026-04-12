"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, Stat, Bar, Empty, PageShell } from "@/lib/ui";

const ADMIN_EMAILS = ["aditianapindi@gmail.com", "aditi@test.com"];

interface InsightsData {
  signups: { total: number; byDay: Record<string, number> };
  assessments: {
    total: number;
    byDay: Record<string, number>;
    bySource: Record<string, number>;
    avgScore: number;
    careWorries: Record<string, number>;
  };
  pageViews: {
    total: number;
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
    <PageShell title="GetSukoon Insights">
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
        <Card title="Assessments"><Stat label="Total" value={data.assessments.total} /></Card>
        <Card title="Avg Score"><Stat label="Diagnostic" value={data.assessments.avgScore} /></Card>
        <Card title="Page Views"><Stat label="Total" value={data.pageViews.total} /></Card>
      </div>

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
