"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, Badge, Empty, Button } from "@/lib/ui";
import Link from "next/link";

/* ─── Types (mirroring vault-types.ts) ─── */

interface PassportCode {
  id: string;
  owner_user_id: string;
  code: string;
  parent_id: string | null;
  label: string | null;
  created_at: string;
  expires_at: string;
  claimed_at: string | null;
  claimed_by_device: string | null;
  revoked_at: string | null;
}

interface DeviceRegistration {
  id: string;
  passport_code: string;
  device_token: string;
  device_info: string | null;
  registered_at: string;
  last_seen_at: string;
}

/* ─── Helpers ─── */

function codeStatus(code: PassportCode): { label: string; color: "sage" | "blue" | "mustard" | "terracotta" } {
  if (code.revoked_at) return { label: "Revoked", color: "terracotta" };
  if (code.claimed_at) return { label: "Claimed", color: "blue" };
  if (new Date(code.expires_at) <= new Date()) return { label: "Expired", color: "mustard" };
  return { label: "Active", color: "sage" };
}

function isOnline(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() < 30 * 60 * 1000;
}

function formatExpiry(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
  return `Expires in ${minutes}m`;
}

/* ─── Page ─── */

export default function SaayaPage() {
  const { authFetch } = useAuth();
  const [codes, setCodes] = useState<PassportCode[]>([]);
  const [devices, setDevices] = useState<DeviceRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [freshCode, setFreshCode] = useState<PassportCode | null>(null);

  const load = async () => {
    try {
      const res = await authFetch("/api/vault/passport-codes");
      const data = await res.json();
      setCodes(Array.isArray(data.codes) ? data.codes : []);
      setDevices(Array.isArray(data.devices) ? data.devices : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setCreating(true);
    try {
      const res = await authFetch("/api/vault/passport-codes", {
        method: "POST",
        body: JSON.stringify({ label: newLabel || null }),
      });
      if (res.ok) {
        const created = await res.json();
        setCodes((prev) => [created, ...prev]);
        setFreshCode(created);
        setNewLabel("");
        // auto-copy
        await navigator.clipboard.writeText(created.code).catch(() => {});
        setCopiedCode(created.code);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this passport code? The linked device will lose access immediately.")) return;
    const res = await authFetch("/api/vault/passport-codes", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, revoked_at: new Date().toISOString() } : c)));
      if (freshCode?.id === id) setFreshCode(null);
    }
  };

  const deviceForCode = (codeStr: string) => devices.find((d) => d.passport_code === codeStr);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink font-[family-name:var(--font-display)]">
            Saaya Safety
          </h1>
          <p className="text-sm text-ink-tertiary mt-1">
            Link the Saaya app on your parent&apos;s phone to monitor fraud calls
          </p>
        </div>
        <Link
          href="/vault/saaya/alerts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:opacity-80 transition-opacity min-h-[44px] px-3"
        >
          View fraud alerts
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Generate code section */}
      {!showForm && !freshCode && (
        <Button onClick={() => setShowForm(true)}>Generate passport code</Button>
      )}

      {showForm && !freshCode && (
        <Card>
          <div className="space-y-3">
            <label className="text-sm font-medium text-ink">New passport code</label>
            <input
              type="text"
              placeholder="Optional label (e.g. Dad's phone)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px]"
            />
            <div className="flex items-center gap-2">
              <Button onClick={handleGenerate} disabled={creating}>
                {creating ? (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setNewLabel(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Freshly generated code display */}
      {freshCode && (
        <Card>
          <div className="text-center space-y-4 py-2">
            <p className="text-sm text-ink-secondary">
              {freshCode.label || "Passport code"} — enter this on the Saaya app
            </p>
            <div className="tracking-[0.3em] text-3xl font-mono text-ink text-center select-all">
              {freshCode.code}
            </div>
            <button
              onClick={() => handleCopy(freshCode.code)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity"
            >
              {copiedCode === freshCode.code ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 11V3.5C3 3.22386 3.22386 3 3.5 3H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Copy code
                </>
              )}
            </button>
            <p className="text-xs text-ink-tertiary">{formatExpiry(freshCode.expires_at)}</p>
            <button
              onClick={() => { setFreshCode(null); setShowForm(false); }}
              className="text-sm text-ink-tertiary hover:text-ink transition-colors min-h-[44px]"
            >
              Done
            </button>
          </div>
        </Card>
      )}

      {/* Codes list */}
      {codes.length === 0 && !showForm && !freshCode ? (
        <Empty message="No passport codes yet. Generate a code to link the Saaya app on your parent's phone." />
      ) : (
        <div className="space-y-3">
          {codes.map((code) => {
            const status = codeStatus(code);
            const device = deviceForCode(code.code);
            return (
              <Card key={code.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm text-ink tracking-wider">{code.code}</span>
                      <Badge color={status.color}>{status.label}</Badge>
                    </div>
                    <p className="text-sm text-ink-secondary">{code.label || "Unlabeled"}</p>

                    {code.claimed_at && device && (
                      <div className="flex items-center gap-2 text-xs text-ink-tertiary mt-1">
                        {isOnline(device.last_seen_at) ? (
                          <span className="inline-block w-2 h-2 rounded-full bg-sage" />
                        ) : (
                          <span className="inline-block w-2 h-2 rounded-full bg-ink-tertiary" />
                        )}
                        <span>{device.device_info || "Unknown device"}</span>
                        <span>·</span>
                        <span>{isOnline(device.last_seen_at) ? "Online" : "Offline"}</span>
                      </div>
                    )}

                    {!code.claimed_at && !code.revoked_at && new Date(code.expires_at) > new Date() && (
                      <p className="text-xs text-ink-tertiary">{formatExpiry(code.expires_at)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {!code.revoked_at && !code.claimed_at && new Date(code.expires_at) > new Date() && (
                      <button
                        onClick={() => handleCopy(code.code)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-ink-tertiary hover:bg-sand transition-colors"
                        title="Copy code"
                      >
                        {copiedCode === code.code ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8L6.5 11.5L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M3 11V3.5C3 3.22386 3.22386 3 3.5 3H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        )}
                      </button>
                    )}
                    {!code.revoked_at && (
                      <button
                        onClick={() => handleRevoke(code.id)}
                        className="px-3 py-1.5 text-xs font-medium text-terracotta border border-terracotta/30 rounded-[8px] hover:bg-terracotta-light transition-colors min-h-[36px]"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
