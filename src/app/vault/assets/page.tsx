"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { FinancialAsset, Parent } from "@/lib/vault-types";

const ASSET_TYPES = [
  "Bank Account",
  "Fixed Deposit",
  "Life Insurance",
  "Health Insurance",
  "Pension/PF",
  "Property",
  "Investments",
  "Gold/Jewelry",
  "Will/Legal",
  "Other",
];

const STATUS_OPTIONS = [
  { value: "have_details", label: "Have details" },
  { value: "exists_unseen", label: "Exists but haven\u2019t seen" },
  { value: "need_to_check", label: "Need to check" },
];

function statusLabel(value: string) {
  return STATUS_OPTIONS.find((s) => s.value === value)?.label ?? value;
}

function statusDotColor(value: string) {
  if (value === "have_details") return "bg-sage";
  if (value === "exists_unseen") return "bg-mustard";
  return "bg-terracotta";
}

export default function AssetsPage() {
  const { authFetch } = useAuth();
  const [assets, setAssets] = useState<FinancialAsset[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch("/api/vault/assets").then((r) => r.json()),
      authFetch("/api/vault/parents").then((r) => r.json()),
    ]).then(([a, p]) => {
      setAssets(Array.isArray(a) ? a : []);
      setParents(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, [authFetch]);

  const handleAdd = async (asset: Partial<FinancialAsset>) => {
    const res = await authFetch("/api/vault/assets", {
      method: "POST",
      body: JSON.stringify(asset),
    });
    if (res.ok) {
      const newAsset = await res.json();
      setAssets((prev) => [newAsset, ...prev]);
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await authFetch("/api/vault/assets", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setAssets((prev) => prev.filter((a) => a.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  // Group assets by parent
  const byParent: { label: string; parentId: string | null; items: FinancialAsset[] }[] = [];

  // Shared assets (no parent)
  const shared = assets.filter((a) => !a.parent_id);
  if (shared.length > 0) byParent.push({ label: "Shared / Joint", parentId: null, items: shared });

  // Per-parent
  parents.forEach((p) => {
    const items = assets.filter((a) => a.parent_id === p.id);
    if (items.length > 0) byParent.push({ label: p.label, parentId: p.id, items });
  });

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
            Financial Assets
          </h1>
          <p className="text-ink-secondary text-sm md:text-base">
            What your parents have &mdash; not how much, just what exists
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] md:min-h-[48px] hover:opacity-90 transition-opacity"
        >
          + Add asset
        </button>
      </div>

      {showForm && (
        <AssetForm
          parents={parents}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {assets.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-6">
          {byParent.map((group) => {
            // Sub-group by asset type within this parent
            const byType: Record<string, FinancialAsset[]> = {};
            group.items.forEach((a) => {
              const t = a.asset_type || "Other";
              if (!byType[t]) byType[t] = [];
              byType[t].push(a);
            });

            return (
              <div key={group.label}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{group.parentId ? "👤" : "👥"}</span>
                  <p className="text-sm md:text-base font-semibold text-ink">
                    {group.label}
                  </p>
                  <span className="text-ink-tertiary text-xs">{group.items.length} asset{group.items.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-3 ml-1">
                  {Object.entries(byType).map(([type, items]) => (
                    <div key={type}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <span className="text-sm">{assetIcon(type)}</span>
                        <p className="text-xs md:text-sm font-medium text-ink-tertiary uppercase tracking-wide">{type}</p>
                      </div>
                      <div className="bg-surface border border-border-subtle rounded-[12px] divide-y divide-border-subtle overflow-hidden">
                        {items.map((asset) => (
                          <AssetRow
                            key={asset.id}
                            asset={asset}
                            parents={parents}
                            onDelete={() => handleDelete(asset.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssetForm({
  parents,
  onSubmit,
  onCancel,
}: {
  parents: Parent[];
  onSubmit: (a: Partial<FinancialAsset>) => void;
  onCancel: () => void;
}) {
  const [assetType, setAssetType] = useState("");
  const [institution, setInstitution] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("need_to_check");
  const [parentId, setParentId] = useState(parents.length === 1 ? parents[0].id : "");

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Add a financial asset</p>
      <div className="space-y-4">
        <div>
          <p className="text-ink text-sm font-medium mb-2">Type of asset</p>
          <div className="flex flex-wrap gap-2">
            {ASSET_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAssetType(assetType === t ? "" : t)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                  assetType === t
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="Institution (e.g. SBI, LIC, HDFC)"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description (optional)"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <div>
          <p className="text-ink text-sm font-medium mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                  status === s.value
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {parents.length >= 1 && (
          <div>
            <p className="text-ink text-sm font-medium mb-2">For which parent?</p>
            <div className="flex flex-wrap gap-2">
              {parents.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setParentId(p.id)}
                  className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                    parentId === p.id
                      ? "bg-sage text-white border-sage"
                      : "bg-white border-border text-ink-secondary hover:border-sage/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              {parents.length > 1 && (
                <button
                  type="button"
                  onClick={() => setParentId("")}
                  className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                    parentId === ""
                      ? "bg-sage text-white border-sage"
                      : "bg-white border-border text-ink-secondary hover:border-sage/50"
                  }`}
                >
                  Shared
                </button>
              )}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (!assetType) return;
              onSubmit({
                asset_type: assetType,
                institution: institution.trim() || null,
                description: description.trim() || null,
                status,
                parent_id: parentId || null,
              });
            }}
            disabled={!assetType}
            className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save asset
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 text-ink-secondary font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:bg-sand transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AssetRow({
  asset,
  parents,
  onDelete,
}: {
  asset: FinancialAsset;
  parents: Parent[];
  onDelete: () => void;
}) {
  void parents; // grouped by parent already

  return (
    <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 group">
      <span className={`w-2 h-2 rounded-full ${statusDotColor(asset.status)} shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink text-sm md:text-base truncate">
            {asset.institution || asset.description || asset.asset_type}
          </p>
          <span className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
            asset.status === "have_details" ? "bg-sage-light text-sage" : asset.status === "exists_unseen" ? "bg-mustard-light text-mustard" : "bg-terracotta-light text-terracotta"
          }`}>
            {statusLabel(asset.status)}
          </span>
        </div>
        {asset.description && asset.institution && (
          <p className="text-xs md:text-sm text-ink-tertiary truncate">{asset.description}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary opacity-0 group-hover:opacity-100 hover:bg-terracotta-light hover:text-terracotta transition-all shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function assetIcon(type: string): string {
  const icons: Record<string, string> = {
    "Bank Account": "🏦",
    "Fixed Deposit": "💰",
    "Life Insurance": "🛡️",
    "Health Insurance": "❤️",
    "Pension/PF": "🏛️",
    "Property": "🏠",
    "Investments": "📈",
    "Gold/Jewelry": "✨",
    "Will/Legal": "📜",
    "Other": "📋",
  };
  return icons[type] || "📋";
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" />
          <path d="M3 10H21" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="12" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
      <p className="font-medium text-ink text-base md:text-lg mb-1">No financial assets listed yet</p>
      <p className="text-ink-secondary text-sm md:text-base mb-5 max-w-md mx-auto">
        &#x20B9;1.84 lakh crore in financial assets go unclaimed in India every year. Start by listing what your parents have &mdash; you don&apos;t need exact numbers.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity"
      >
        Add your first asset
      </button>
    </div>
  );
}
