"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { HealthDocument, Parent } from "@/lib/vault-types";

const DOC_TYPE_LABELS: Record<string, string> = {
  prescription: "Prescription",
  test_report: "Test report",
  insurance: "Insurance card",
  other: "Other",
};

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.heic,.heif,application/pdf,image/*";

export default function DocumentsPage() {
  const { authFetch } = useAuth();
  const [docs, setDocs] = useState<HealthDocument[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [d, p] = await Promise.all([
      authFetch("/api/vault/documents").then((r) => r.json()),
      authFetch("/api/vault/parents").then((r) => r.json()),
    ]);
    setDocs(Array.isArray(d) ? d : []);
    setParents(Array.isArray(p) ? p : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploaded = (doc: HealthDocument) => {
    setDocs((prev) => [doc, ...prev]);
    setShowForm(false);
  };

  const handleOpen = async (id: string) => {
    const res = await authFetch(`/api/vault/documents/${id}/url`);
    if (!res.ok) {
      alert("Couldn't open file. It may have been moved or deleted.");
      return;
    }
    const { url } = await res.json();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await authFetch("/api/vault/documents", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  // Group by parent
  const groups: { label: string; parentId: string | null; items: HealthDocument[] }[] = [];
  const general = docs.filter((d) => !d.parent_id);
  if (general.length > 0) groups.push({ label: "Shared", parentId: null, items: general });
  parents.forEach((p) => {
    const items = docs.filter((d) => d.parent_id === p.id);
    if (items.length > 0) groups.push({ label: p.label, parentId: p.id, items });
  });

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
            Health documents
          </h1>
          <p className="text-ink-secondary text-sm md:text-base">
            Prescriptions, test reports, insurance cards — kept safe.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="shrink-0 px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] md:min-h-[48px] hover:opacity-90 transition-opacity"
          >
            + Upload
          </button>
        )}
      </div>

      {showForm && (
        <UploadForm parents={parents} onDone={handleUploaded} onCancel={() => setShowForm(false)} />
      )}

      {!showForm && <ABHACard />}

      {docs.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{group.parentId ? "👤" : "👥"}</span>
                <p className="text-sm md:text-base font-semibold text-ink">{group.label}</p>
                <span className="text-ink-tertiary text-xs">
                  {group.items.length} file{group.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="bg-surface border border-border-subtle rounded-[12px] divide-y divide-border-subtle overflow-hidden ml-1">
                {group.items.map((doc) => (
                  <DocRow
                    key={doc.id}
                    doc={doc}
                    onOpen={() => handleOpen(doc.id)}
                    onDelete={() => handleDelete(doc.id, doc.file_name)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-8 text-ink-tertiary text-xs text-center">
        Max 10 MB per file · PDF, JPG, PNG, HEIC only
      </p>
    </div>
  );
}

function UploadForm({
  parents,
  onDone,
  onCancel,
}: {
  parents: Parent[];
  onDone: (doc: HealthDocument) => void;
  onCancel: () => void;
}) {
  const [docType, setDocType] = useState<string>("prescription");
  const [parentId, setParentId] = useState<string>(parents.length === 1 ? parents[0].id : "");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!file) {
      setError("Pick a file first.");
      return;
    }
    setError(null);
    setUploading(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("doc_type", docType);
    if (parentId) fd.append("parent_id", parentId);
    if (notes.trim()) fd.append("notes", notes.trim());

    try {
      // authFetch sets Content-Type to JSON which breaks FormData uploads,
      // so we build the request ourselves using the same token logic.
      const { getSupabase } = await import("@/lib/supabase-browser");
      const supabase = getSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch("/api/vault/documents", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Upload failed.");
        setUploading(false);
        return;
      }
      const doc = await res.json();
      onDone(doc);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setUploading(false);
    }
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Upload a document</p>

      <label className="block text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-1.5">
        Document type
      </label>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setDocType(value)}
            className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] ${
              docType === value
                ? "bg-sage text-white border-sage"
                : "bg-white border-border text-ink-secondary hover:border-sage/50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {parents.length > 0 && (
        <>
          <label className="block text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-1.5">
            For whom
          </label>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <button
              type="button"
              onClick={() => setParentId("")}
              className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] ${
                parentId === ""
                  ? "bg-sage text-white border-sage"
                  : "bg-white border-border text-ink-secondary hover:border-sage/50"
              }`}
            >
              Shared
            </button>
            {parents.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setParentId(p.id)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] ${
                  parentId === p.id
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}

      <label className="block text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-1.5">
        File
      </label>
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm font-medium min-h-[44px] hover:border-sage transition-colors"
        >
          {file ? "Change file" : "Choose file"}
        </button>
        {file && (
          <span className="text-ink-secondary text-xs truncate flex-1">
            {file.name} · {(file.size / 1024).toFixed(0)} KB
          </span>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <label className="block text-xs font-medium text-ink-tertiary uppercase tracking-wide mb-1.5">
        Notes (optional)
      </label>
      <input
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Blood work from March check-up"
        className="w-full px-3 py-2.5 bg-white border-2 border-border rounded-[10px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px] mb-4"
      />

      {error && (
        <p className="text-terracotta text-sm mb-3">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={uploading || !file}
          className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
        <button
          onClick={onCancel}
          disabled={uploading}
          className="px-4 py-3 text-ink-secondary font-medium rounded-[10px] text-base min-h-[48px] hover:bg-sand transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function DocRow({
  doc,
  onOpen,
  onDelete,
}: {
  doc: HealthDocument;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 group">
      <DocIcon mime={doc.mime_type} />
      <button onClick={onOpen} className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink text-sm md:text-base truncate">{doc.file_name}</p>
          <span className="text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-sage-light text-sage">
            {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
          </span>
        </div>
        <p className="text-xs md:text-sm text-ink-tertiary truncate">
          {(doc.file_size / 1024).toFixed(0)} KB · {formatDate(doc.uploaded_at)}
          {doc.notes && <> · {doc.notes}</>}
        </p>
      </button>
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-9 h-9 rounded-full text-ink-tertiary opacity-0 group-hover:opacity-100 hover:bg-terracotta-light hover:text-terracotta transition-all"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function DocIcon({ mime }: { mime: string }) {
  const isPDF = mime === "application/pdf";
  const isImage = mime.startsWith("image/");
  return (
    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
      isPDF ? "bg-terracotta-light text-terracotta" : isImage ? "bg-blue-light text-blue" : "bg-sand text-ink-tertiary"
    }`}>
      {isPDF ? (
        <span className="text-[10px] font-bold">PDF</span>
      ) : isImage ? (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="3" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="7" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 15L7 11L12 15L16 12L18 14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path d="M5 2H11L15 6V17C15 17.5523 14.5523 18 14 18H5C4.44772 18 4 17.5523 4 17V3C4 2.44772 4.44772 2 5 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sage">
          <path d="M6 3H14L19 8V20C19 20.5523 18.5523 21 18 21H6C5.44772 21 5 20.5523 5 20V4C5 3.44772 5.44772 3 6 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M14 3V8H19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-medium text-ink text-base md:text-lg mb-1">No documents yet</p>
      <p className="text-ink-secondary text-sm md:text-base mb-5">
        Keep prescriptions, test reports, and insurance cards in one place. Private and only visible to your vault.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] hover:opacity-90 transition-opacity"
      >
        Upload your first document
      </button>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── ABHA waitlist card ─── */

function ABHACard() {
  const { authFetch } = useAuth();
  const [state, setState] = useState<"loading" | "idle" | "joining" | "joined">("loading");

  useEffect(() => {
    authFetch("/api/vault/abha-waitlist")
      .then((r) => r.json())
      .then((data) => setState(data.joined ? "joined" : "idle"))
      .catch(() => setState("idle"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = async () => {
    setState("joining");
    const res = await authFetch("/api/vault/abha-waitlist", { method: "POST" });
    if (res.ok) setState("joined");
    else setState("idle");
  };

  if (state === "loading") return null;

  return (
    <div className="mb-6 bg-gradient-to-br from-sage-light/60 to-blue-light/40 border border-sage/20 rounded-[14px] p-5 md:p-6 relative overflow-hidden">
      {/* Decorative corner leaf */}
      <div className="absolute -top-4 -right-4 opacity-10">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <path d="M20 80C20 80 30 50 60 30C60 30 80 20 80 20C80 20 80 40 70 60C50 70 20 80 20 80Z" fill="#7A8B6F" />
        </svg>
      </div>

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-mustard-light text-mustard text-[10px] font-bold uppercase tracking-wide rounded-full">
            Coming soon
          </span>
        </div>
        <h3 className="font-[family-name:var(--font-display)] text-lg md:text-xl font-medium text-ink mb-1.5">
          Link your parent&apos;s ABHA
        </h3>
        <p className="text-ink-secondary text-sm md:text-base mb-4 max-w-[480px]">
          Ayushman Bharat Health Account — pull every hospital visit, prescription, and lab report across all ABDM-linked hospitals into one place. No more chasing files.
        </p>

        {state === "joined" ? (
          <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-sage text-white rounded-[10px] text-sm font-medium min-h-[40px]">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 4.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            You&apos;re on the list — we&apos;ll email you when it&apos;s ready
          </div>
        ) : (
          <button
            onClick={handleJoin}
            disabled={state === "joining"}
            className="px-5 py-2.5 bg-ink text-cream font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {state === "joining" ? "Adding you…" : "Notify me when it's ready"}
          </button>
        )}
      </div>
    </div>
  );
}
