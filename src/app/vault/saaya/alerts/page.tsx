"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, Stat, Badge, Empty } from "@/lib/ui";
import Link from "next/link";
import type { SaayaEvent } from "@/lib/vault-types";

/* ─── Helpers ─── */

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function classificationColor(classification: string): "sage" | "terracotta" | "blue" | "mustard" {
  const lower = classification.toLowerCase();
  if (lower === "known" || lower === "safe") return "sage";
  if (lower === "unknown" || lower === "scam" || lower === "spam") return "terracotta";
  if (lower === "suspected") return "mustard";
  return "blue";
}

function callTypeColor(callType: string): "sage" | "terracotta" | "blue" | "mustard" {
  const lower = callType.toLowerCase();
  if (lower === "incoming") return "blue";
  if (lower === "outgoing") return "sage";
  if (lower === "missed") return "terracotta";
  return "mustard";
}

/* ─── Page ─── */

export default function AlertsPage() {
  const { authFetch } = useAuth();
  const [events, setEvents] = useState<SaayaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch("/api/vault/saaya-events");
        const data = await res.json();
        setEvents(Array.isArray(data.events) ? data.events : []);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  const lastEvent = events.length > 0 ? events[0] : null;
  const lastAlertTime = lastEvent ? relativeTime(new Date(lastEvent.timestamp_millis)) : "\u2014";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/vault/saaya"
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink-tertiary hover:bg-sand transition-colors shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4L6 8L10 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ink font-[family-name:var(--font-display)]">
            Fraud Alerts
          </h1>
          <p className="text-sm text-ink-tertiary mt-0.5">
            Suspicious call activity detected by Saaya
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Stat label="Total alerts" value={events.length} />
        </Card>
        <Card>
          <Stat label="Last alert" value={lastAlertTime} size="sm" />
        </Card>
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <Empty message="No fraud alerts yet. When Saaya detects a suspicious call on your parent's phone, alerts will appear here." />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge color={callTypeColor(event.call_type)}>{event.call_type}</Badge>
                    <Badge color={classificationColor(event.caller_classification)}>
                      {event.caller_classification}
                    </Badge>
                  </div>
                  <span className="text-xs text-ink-tertiary shrink-0">
                    {relativeTime(new Date(event.timestamp_millis))}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-ink">
                    {event.caller_label || "Unknown caller"}
                  </p>
                  {event.sensitive_app_name && (
                    <span className="text-xs text-ink-tertiary bg-sand px-2 py-0.5 rounded-full">
                      {event.sensitive_app_name}
                    </span>
                  )}
                </div>

                {event.is_overlay_trigger && (
                  <p className="text-xs text-terracotta font-medium">
                    Overlay protection triggered
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
