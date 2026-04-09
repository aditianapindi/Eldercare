"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import type { Doctor, Parent } from "@/lib/vault-types";

export default function DoctorsPage() {
  const { authFetch } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Promise.all([
      authFetch("/api/vault/doctors").then((r) => r.json()),
      authFetch("/api/vault/parents").then((r) => r.json()),
    ]).then(([d, p]) => {
      setDoctors(Array.isArray(d) ? d : []);
      setParents(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, [authFetch]);

  const handleAdd = async (doctor: Partial<Doctor>) => {
    const res = await authFetch("/api/vault/doctors", {
      method: "POST",
      body: JSON.stringify(doctor),
    });
    if (res.ok) {
      const newDoctor = await res.json();
      setDoctors((prev) => [newDoctor, ...prev]);
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await authFetch("/api/vault/doctors", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setDoctors((prev) => prev.filter((d) => d.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-3 border-sage border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
            Doctors
          </h1>
          <p className="text-ink-secondary text-sm md:text-base">
            Your parents&apos; doctors and specialists
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] md:min-h-[48px] hover:opacity-90 transition-opacity"
        >
          + Add doctor
        </button>
      </div>

      {showForm && (
        <DoctorForm
          parents={parents}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
        />
      )}

      {doctors.length === 0 && !showForm ? (
        <EmptyState onAdd={() => setShowForm(true)} />
      ) : (
        <GroupedDoctors doctors={doctors} parents={parents} onDelete={handleDelete} />
      )}
    </div>
  );
}

function DoctorForm({
  parents,
  onSubmit,
  onCancel,
}: {
  parents: Parent[];
  onSubmit: (d: Partial<Doctor>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [hospital, setHospital] = useState("");
  const [phone, setPhone] = useState("");
  const [parentId, setParentId] = useState("");

  const specialties = [
    "General Physician",
    "Cardiologist",
    "Orthopedic",
    "Neurologist",
    "Ophthalmologist",
    "ENT",
    "Diabetologist",
    "Pulmonologist",
    "Dermatologist",
    "Other",
  ];

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Add a doctor</p>
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Dr. Sharma, Dr. Reddy"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
          autoFocus
        />
        <div>
          <p className="text-ink text-sm font-medium mb-2">Specialty</p>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpecialty(specialty === s ? "" : s)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                  specialty === s
                    ? "bg-sage text-white border-sage"
                    : "bg-white border-border text-ink-secondary hover:border-sage/50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <input
          value={hospital}
          onChange={(e) => setHospital(e.target.value)}
          placeholder="e.g. Apollo, Care Hospitals, local clinic"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone number"
          type="tel"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        {parents.length > 1 && (
          <div>
            <p className="text-ink text-sm font-medium mb-2">For which parent?</p>
            <div className="flex gap-2">
              {parents.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setParentId(parentId === p.id ? "" : p.id)}
                  className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                    parentId === p.id
                      ? "bg-sage text-white border-sage"
                      : "bg-white border-border text-ink-secondary hover:border-sage/50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (!name.trim()) return;
              onSubmit({
                name: name.trim(),
                specialty: specialty || null,
                hospital: hospital.trim() || null,
                phone: phone.trim() || null,
                parent_id: parentId || null,
              });
            }}
            disabled={!name.trim()}
            className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save doctor
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

function GroupedDoctors({
  doctors,
  parents,
  onDelete,
}: {
  doctors: Doctor[];
  parents: Parent[];
  onDelete: (id: string) => void;
}) {
  const byParent: { label: string; parentId: string | null; items: Doctor[] }[] = [];

  // General doctors (no parent assigned)
  const general = doctors.filter((d) => !d.parent_id);
  if (general.length > 0) byParent.push({ label: "General", parentId: null, items: general });

  // Per-parent groups
  parents.forEach((p) => {
    const items = doctors.filter((d) => d.parent_id === p.id);
    if (items.length > 0) byParent.push({ label: p.label, parentId: p.id, items });
  });

  return (
    <div className="space-y-6">
      {byParent.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">{group.parentId ? "\uD83D\uDC64" : "\uD83D\uDC65"}</span>
            <p className="text-sm md:text-base font-semibold text-ink">
              {group.label}
            </p>
            <span className="text-ink-tertiary text-xs">
              {group.items.length} doctor{group.items.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="bg-surface border border-border-subtle rounded-[12px] divide-y divide-border-subtle overflow-hidden ml-1">
            {group.items.map((doctor) => (
              <DoctorRow
                key={doctor.id}
                doctor={doctor}
                onDelete={() => onDelete(doctor.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DoctorRow({
  doctor,
  onDelete,
}: {
  doctor: Doctor;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink text-sm md:text-base truncate">{doctor.name}</p>
          {doctor.specialty && (
            <span className="text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-sage-light text-sage">
              {doctor.specialty}
            </span>
          )}
        </div>
        {doctor.hospital && (
          <p className="text-xs md:text-sm text-ink-tertiary truncate">{doctor.hospital}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {doctor.phone && (
          <a
            href={`tel:${doctor.phone}`}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-sage-light text-sage hover:bg-sage hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 2H4C2.89543 2 2 2.89543 2 4C2 9.52285 6.47715 14 12 14C13.1046 14 14 13.1046 14 12V10L11 9L9.5 10.5C8.57201 10.0366 7.56269 9.42737 6.56802 8.43198C5.57336 7.43731 4.96398 6.42779 4.5 5.5L6 4L5 1L6 2Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        )}
        <button
          onClick={onDelete}
          className="flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary opacity-0 group-hover:opacity-100 hover:bg-terracotta-light hover:text-terracotta transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 text-center">
      <div className="w-14 h-14 rounded-full bg-sage-light flex items-center justify-center mx-auto mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-sage">
          <rect x="4" y="2" width="16" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
          <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-medium text-ink text-base md:text-lg mb-1">No doctors yet</p>
      <p className="text-ink-secondary text-sm md:text-base mb-5">
        Your care assessment flagged health awareness as an area to explore. Start by adding your parents&apos; regular doctors.
      </p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity"
      >
        Add your first doctor
      </button>
    </div>
  );
}
