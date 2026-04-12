"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { FamilyContact, Parent } from "@/lib/vault-types";

const ROLES = [
  { value: "family", label: "Family", icon: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67" },
  { value: "neighbor", label: "Neighbor", icon: "\uD83C\uDFE0" },
  { value: "driver", label: "Driver", icon: "\uD83D\uDE97" },
  { value: "maid", label: "Maid / Help", icon: "\uD83C\uDFE1" },
  { value: "emergency", label: "Emergency", icon: "\uD83D\uDEA8" },
  { value: "doctor", label: "Doctor", icon: "\uD83C\uDFE5" },
  { value: "other", label: "Other", icon: "\uD83D\uDC64" },
];

function getRoleInfo(role: string) {
  return ROLES.find((r) => r.value === role) || ROLES[ROLES.length - 1];
}

export default function ContactsPage() {
  const { authFetch } = useAuth();
  const [contacts, setContacts] = useState<FamilyContact[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      authFetch("/api/vault/contacts").then((r) => r.json()),
      authFetch("/api/vault/parents").then((r) => r.json()),
    ]).then(([c, p]) => {
      setContacts(Array.isArray(c) ? c : []);
      setParents(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, [authFetch]);

  const handleAdd = async (contact: Partial<FamilyContact>) => {
    const res = await authFetch("/api/vault/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    });
    if (res.ok) {
      const c = await res.json();
      setContacts((prev) => [c, ...prev]);
      setShowForm(false);
    } else {
      alert("Couldn't save. Please try again.");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<FamilyContact>) => {
    const res = await authFetch("/api/vault/contacts", {
      method: "PUT",
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } else {
      alert("Couldn't save. Please try again.");
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    const res = await authFetch("/api/vault/contacts", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  // Group by parent_id
  const groups: { label: string; parentId: string | null; items: FamilyContact[] }[] = [];

  // Shared / no parent contacts first
  const shared = contacts.filter((c) => !c.parent_id);
  if (shared.length > 0) groups.push({ label: "Shared / Family", parentId: null, items: shared });

  // Per-parent groups
  parents.forEach((p) => {
    const items = contacts.filter((c) => c.parent_id === p.id);
    if (items.length > 0) groups.push({ label: p.label, parentId: p.id, items });
  });

  // Summary counts
  const emergencyCount = contacts.filter((c) => c.role === "emergency").length;
  const withPhone = contacts.filter((c) => c.phone).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
            Contacts
          </h1>
          <p className="text-ink-secondary text-sm md:text-base">
            Important people in your parents&apos; daily life
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] md:min-h-[48px] hover:opacity-90 transition-opacity"
        >
          + Add contact
        </button>
      </div>

      {/* Summary bar */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-sage-light/60 rounded-full text-[11px] md:text-xs font-medium text-sage">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </span>
          {withPhone > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-light/60 rounded-full text-[11px] md:text-xs font-medium text-blue">
              {withPhone} with phone
            </span>
          )}
          {emergencyCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-terracotta-light/60 rounded-full text-[11px] md:text-xs font-medium text-terracotta">
              {emergencyCount} emergency
            </span>
          )}
          {emergencyCount === 0 && contacts.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-mustard-light/60 rounded-full text-[11px] md:text-xs font-medium text-mustard">
              No emergency contact yet
            </span>
          )}
        </div>
      )}

      {showForm && (
        <ContactForm parents={parents} onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {contacts.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">{group.parentId ? "\uD83D\uDC64" : "\uD83D\uDC65"}</span>
                <p className="text-sm md:text-base font-semibold text-ink">
                  {group.label}
                </p>
                <span className="text-ink-tertiary text-xs">
                  {group.items.length} contact{group.items.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="space-y-2">
                {group.items.map((contact) =>
                  editingId === contact.id ? (
                    <EditContactCard
                      key={contact.id}
                      contact={contact}
                      parents={parents}
                      onSave={(updates) => handleUpdate(contact.id, updates)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <ContactCard
                      key={contact.id}
                      contact={contact}
                      onEdit={() => setEditingId(contact.id)}
                      onDelete={() => handleDelete(contact.id, contact.name)}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Contact card with avatar, phone, edit --- */

function ContactCard({
  contact,
  onEdit,
  onDelete,
}: {
  contact: FamilyContact;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const roleInfo = getRoleInfo(contact.role);

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-4 md:p-5">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-sage-light flex items-center justify-center shrink-0 text-base">
          {roleInfo.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink text-sm md:text-base truncate">{contact.name}</p>
          <div className="flex items-center gap-2 text-xs md:text-sm text-ink-tertiary">
            {contact.relationship && <span className="truncate">{contact.relationship}</span>}
            {contact.phone && contact.relationship && <span>&middot;</span>}
            {contact.phone && <span className="shrink-0">{contact.phone}</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-sage text-white hover:opacity-90 transition-opacity"
              title="Call"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H4C2.89543 2 2 2.89543 2 4C2 9.52285 6.47715 14 12 14C13.1046 14 14 13.1046 14 12V10L11 9L9.5 10.5C8.57201 10.0366 7.56269 9.42737 6.56802 8.43198C5.57336 7.43731 4.96398 6.42779 4.5 5.5L6 4L5 1L6 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </a>
          )}
          <button
            onClick={onEdit}
            className="flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary hover:bg-sand transition-colors"
            title="Edit"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary hover:bg-terracotta-light hover:text-terracotta transition-colors"
            title="Remove"
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/* --- Inline edit card --- */

function EditContactCard({
  contact,
  parents,
  onSave,
  onCancel,
}: {
  contact: FamilyContact;
  parents: Parent[];
  onSave: (updates: Partial<FamilyContact>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(contact.name);
  const [role, setRole] = useState(contact.role);
  const [phone, setPhone] = useState(contact.phone || "");
  const [relationship, setRelationship] = useState(contact.relationship || "");
  const [parentId, setParentId] = useState(contact.parent_id || "");

  return (
    <div className="bg-surface border-2 border-sage rounded-[14px] p-4 md:p-5 animate-[fadeIn_0.2s_ease]">
      <div className="space-y-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full px-3 py-2.5 bg-white border-2 border-border rounded-[8px] text-ink text-base focus:border-sage focus:outline-none min-h-[44px]"
          autoFocus
        />
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[32px] ${
                role === r.value
                  ? "bg-sage text-white border-sage"
                  : "bg-white border-border text-ink-secondary hover:border-sage/50"
              }`}
            >
              {r.icon} {r.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            type="tel"
            className="px-3 py-2.5 bg-white border-2 border-border rounded-[8px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px]"
          />
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Details (e.g. next door)"
            className="px-3 py-2.5 bg-white border-2 border-border rounded-[8px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px]"
          />
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
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[32px] ${
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
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[32px] ${
                    !parentId
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
        <div className="flex gap-2">
          <button
            onClick={() => onSave({
              name: name.trim() || contact.name,
              role,
              phone: phone.trim() || null,
              relationship: relationship.trim() || null,
              parent_id: parentId || null,
            })}
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
    </div>
  );
}

/* --- Add contact form --- */

function ContactForm({
  parents,
  onSubmit,
  onCancel,
}: {
  parents: Parent[];
  onSubmit: (c: Partial<FamilyContact>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [parentId, setParentId] = useState(parents.length === 1 ? parents[0].id : "");

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Add a contact</p>
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
          autoFocus
        />
        <div>
          <p className="text-ink text-sm font-medium mb-2">Role</p>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(role === r.value ? "" : r.value)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                  role === r.value
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          type="tel"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <input
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          placeholder="Details (e.g. 'next door', 'Mon/Wed/Fri', 'brother in Chennai')"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
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
                    !parentId
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
              if (!name.trim() || !role) return;
              onSubmit({
                name: name.trim(),
                role,
                phone: phone.trim() || null,
                relationship: relationship.trim() || null,
                parent_id: parentId || null,
              });
            }}
            disabled={!name.trim() || !role}
            className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save contact
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

/* --- Empty state --- */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sage">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-medium text-ink text-base md:text-lg mb-1">No contacts yet</p>
      <p className="text-ink-secondary text-sm md:text-base mb-5">
        In an emergency, you&apos;ll need these numbers fast. Add the people your parents depend on day-to-day.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity"
      >
        Add your first contact
      </button>
    </div>
  );
}
