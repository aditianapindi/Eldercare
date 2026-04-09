"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import type { Medicine, Parent, Doctor, MedicalEvent } from "@/lib/vault-types";

const CONDITIONS = [
  "Diabetes",
  "Blood pressure",
  "Heart condition",
  "Arthritis",
  "Respiratory",
  "Vision / hearing",
  "Memory / cognitive",
  "Thyroid",
  "Kidney",
];

const EVENT_TYPES = ["Surgery", "Procedure", "Hospitalization", "Diagnosis"];

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isCurrent(med: Medicine): boolean {
  if (!med.active) return false;
  if (med.is_lifelong) return true;
  if (!med.end_date) return true;
  return med.end_date >= todayStr();
}

export default function HealthPage() {
  const { authFetch } = useAuth();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [events, setEvents] = useState<MedicalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [showMedicineForm, setShowMedicineForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  // Collapsible sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    conditions: true,
    current: true,
    procedures: true,
    past: true,
  });

  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Condition editing
  const [editingConditionsForParent, setEditingConditionsForParent] = useState<string | null>(null);
  const [editConditions, setEditConditions] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      authFetch("/api/vault/medicines").then((r) => r.json()),
      authFetch("/api/vault/parents").then((r) => r.json()),
      authFetch("/api/vault/doctors").then((r) => r.json()),
      authFetch("/api/vault/medical-events").then((r) => r.json()),
    ]).then(([m, p, d, e]) => {
      setMedicines(Array.isArray(m) ? m : []);
      setParents(Array.isArray(p) ? p : []);
      setDoctors(Array.isArray(d) ? d : []);
      setEvents(Array.isArray(e) ? e : []);
      setLoading(false);
    });
  }, [authFetch]);

  // Filtered data by selected parent
  const filterByParent = <T extends { parent_id: string | null }>(items: T[]) =>
    selectedParentId ? items.filter((i) => i.parent_id === selectedParentId) : items;

  const currentMeds = filterByParent(medicines.filter(isCurrent));
  const pastMeds = filterByParent(medicines.filter((m) => !isCurrent(m)));
  const filteredEvents = filterByParent(events);

  // Conditions: collect across filtered parents
  const relevantParents = selectedParentId
    ? parents.filter((p) => p.id === selectedParentId)
    : parents;
  const allConditions = relevantParents.flatMap((p) =>
    p.conditions.map((c) => ({ condition: c, parentLabel: p.label, parentId: p.id }))
  );

  const handleAddMedicine = async (medicine: Partial<Medicine>) => {
    const res = await authFetch("/api/vault/medicines", {
      method: "POST",
      body: JSON.stringify(medicine),
    });
    if (res.ok) {
      const newMed = await res.json();
      setMedicines((prev) => [newMed, ...prev]);
      setShowMedicineForm(false);
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    const res = await authFetch("/api/vault/medicines", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMedicines((prev) =>
        prev.map((m) => (m.id === id ? { ...m, active: false } : m))
      );
    }
  };

  const handleAddEvent = async (event: Partial<MedicalEvent>) => {
    const res = await authFetch("/api/vault/medical-events", {
      method: "POST",
      body: JSON.stringify(event),
    });
    if (res.ok) {
      const newEvent = await res.json();
      setEvents((prev) => [newEvent, ...prev]);
      setShowEventForm(false);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    const res = await authFetch("/api/vault/medical-events", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setEvents((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleSaveConditions = async (parentId: string, conditions: string[]) => {
    const res = await authFetch("/api/vault/parents", {
      method: "PUT",
      body: JSON.stringify({ id: parentId, conditions }),
    });
    if (res.ok) {
      const updated = await res.json();
      setParents((prev) => prev.map((p) => (p.id === parentId ? updated : p)));
    }
    setEditingConditionsForParent(null);
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
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-medium text-ink">
          Health
        </h1>
        <p className="text-ink-secondary text-sm md:text-base">
          Conditions, medicines, and medical history
        </p>
      </div>

      {/* Parent selector */}
      {parents.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setSelectedParentId(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors min-h-[36px] ${
              !selectedParentId
                ? "bg-sage text-white border-sage"
                : "bg-white border-border text-ink-secondary hover:border-sage/50"
            }`}
          >
            All
          </button>
          {parents.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedParentId(selectedParentId === p.id ? null : p.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors min-h-[36px] ${
                selectedParentId === p.id
                  ? "bg-sage text-white border-sage"
                  : "bg-white border-border text-ink-secondary hover:border-sage/50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Section 1: Conditions ─── */}
      <SectionHeader
        title="Conditions"
        count={allConditions.length}
        open={openSections.conditions}
        onToggle={() => toggleSection("conditions")}
      />
      {openSections.conditions && (
        <div className="bg-surface border border-border-subtle rounded-[14px] p-4 md:p-5 mb-6">
          {relevantParents.map((parent) => {
            const isEditing = editingConditionsForParent === parent.id;
            return (
              <div key={parent.id} className="mb-3 last:mb-0">
                {parents.length > 1 && (
                  <p className="text-xs text-ink-tertiary font-medium mb-1.5">{parent.label}</p>
                )}
                {isEditing ? (
                  <ConditionEditor
                    conditions={editConditions}
                    onChange={setEditConditions}
                    onSave={() => handleSaveConditions(parent.id, editConditions)}
                    onCancel={() => setEditingConditionsForParent(null)}
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {parent.conditions.length > 0 ? (
                      parent.conditions.map((c) => (
                        <span
                          key={c}
                          className="px-2 py-0.5 bg-sage-light text-sage text-[11px] md:text-xs font-medium rounded-full"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-ink-tertiary text-sm">No conditions recorded</span>
                    )}
                    <button
                      onClick={() => {
                        setEditConditions(parent.conditions);
                        setEditingConditionsForParent(parent.id);
                      }}
                      className="px-2 py-0.5 text-sage text-xs font-medium hover:underline transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {relevantParents.length === 0 && (
            <p className="text-ink-tertiary text-sm">Add a parent profile first to track conditions.</p>
          )}
        </div>
      )}

      {/* ─── Section 2: Current Medicines ─── */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Current Medicines"
          count={currentMeds.length}
          open={openSections.current}
          onToggle={() => toggleSection("current")}
        />
        {openSections.current && (
          <button
            onClick={() => setShowMedicineForm(true)}
            className="px-4 py-2 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[40px] md:min-h-[44px] hover:opacity-90 transition-opacity mb-3"
          >
            + Add medicine
          </button>
        )}
      </div>
      {openSections.current && (
        <div className="mb-6">
          {showMedicineForm && (
            <MedicineForm
              parents={parents}
              doctors={doctors}
              authFetch={authFetch}
              onSubmit={handleAddMedicine}
              onDoctorAdded={(d: Doctor) => setDoctors((prev) => [d, ...prev])}
              onCancel={() => setShowMedicineForm(false)}
            />
          )}
          {currentMeds.length === 0 && !showMedicineForm ? (
            <div className="bg-surface border border-border-subtle rounded-[14px] p-5 text-center">
              <p className="text-ink-secondary text-sm">No current medicines tracked yet.</p>
              <button
                onClick={() => setShowMedicineForm(true)}
                className="mt-3 px-5 py-2.5 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[44px] hover:opacity-90 transition-opacity"
              >
                Add your first medicine
              </button>
            </div>
          ) : (
            <MedicinesByParent
              meds={currentMeds}
              parents={parents}
              selectedParentId={selectedParentId}
              onDelete={handleDeleteMedicine}
            />
          )}
        </div>
      )}

      {/* ─── Section 3: Procedures & Surgeries ─── */}
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Procedures & Surgeries"
          count={filteredEvents.length}
          open={openSections.procedures}
          onToggle={() => toggleSection("procedures")}
        />
        {openSections.procedures && (
          <button
            onClick={() => setShowEventForm(true)}
            className="px-4 py-2 bg-sage text-white font-medium rounded-[10px] text-sm min-h-[40px] md:min-h-[44px] hover:opacity-90 transition-opacity mb-3"
          >
            + Add procedure
          </button>
        )}
      </div>
      {openSections.procedures && (
        <div className="mb-6">
          {showEventForm && (
            <EventForm
              parents={parents}
              onSubmit={handleAddEvent}
              onCancel={() => setShowEventForm(false)}
            />
          )}
          {filteredEvents.length === 0 && !showEventForm ? (
            <div className="bg-surface border border-border-subtle rounded-[14px] p-5 text-center">
              <p className="text-ink-secondary text-sm">No procedures or surgeries recorded.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border-subtle rounded-[14px] divide-y divide-border-subtle overflow-hidden">
              {filteredEvents.map((evt) => (
                <EventRow
                  key={evt.id}
                  event={evt}
                  parents={parents}
                  onDelete={() => handleDeleteEvent(evt.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Section 4: Past Medicines ─── */}
      <SectionHeader
        title="Past Medicines"
        count={pastMeds.length}
        open={openSections.past}
        onToggle={() => toggleSection("past")}
      />
      {openSections.past && (
        <div className="mb-6">
          {pastMeds.length === 0 ? (
            <div className="bg-surface border border-border-subtle rounded-[14px] p-5 text-center">
              <p className="text-ink-tertiary text-sm">No past medicines.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border-subtle rounded-[14px] divide-y divide-border-subtle overflow-hidden opacity-60">
              {pastMeds.map((med) => (
                <MedicineRow
                  key={med.id}
                  medicine={med}
                  parents={parents}
                  onDelete={() => handleDeleteMedicine(med.id)}
                  muted
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Section header ─── */

function MedicinesByParent({
  meds,
  parents,
  selectedParentId,
  onDelete,
}: {
  meds: Medicine[];
  parents: Parent[];
  selectedParentId: string | null;
  onDelete: (id: string) => void;
}) {
  // If a specific parent is selected, just show time groups (no parent header needed)
  if (selectedParentId) {
    return <TimeGroupedMeds meds={meds} parents={parents} onDelete={onDelete} />;
  }

  // Group by parent first
  const groups: { label: string; parentMeds: Medicine[] }[] = [];
  parents.forEach((p) => {
    const pm = meds.filter((m) => m.parent_id === p.id);
    if (pm.length > 0) groups.push({ label: p.label, parentMeds: pm });
  });
  const unassigned = meds.filter((m) => !m.parent_id);
  if (unassigned.length > 0) groups.push({ label: "General", parentMeds: unassigned });

  // If only 1 parent, skip the parent header
  if (groups.length <= 1) {
    return <TimeGroupedMeds meds={meds} parents={parents} onDelete={onDelete} />;
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">👤</span>
            <p className="text-sm font-semibold text-ink">{g.label}</p>
            <span className="text-ink-tertiary text-xs">{g.parentMeds.length}</span>
          </div>
          <div className="ml-1">
            <TimeGroupedMeds meds={g.parentMeds} parents={parents} onDelete={onDelete} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeGroupedMeds({
  meds,
  parents,
  onDelete,
}: {
  meds: Medicine[];
  parents: Parent[];
  onDelete: (id: string) => void;
}) {
  const byTime: Record<string, Medicine[]> = { Morning: [], Afternoon: [], Evening: [], Night: [], Unscheduled: [] };
  meds.forEach((m) => {
    if (m.time_of_day.length === 0) byTime.Unscheduled.push(m);
    else m.time_of_day.forEach((t) => { if (byTime[t]) byTime[t].push(m); });
  });

  return (
    <div className="space-y-3">
      {Object.entries(byTime).map(([time, timeMeds]) => {
        if (timeMeds.length === 0) return null;
        const timeColor = time === "Morning" ? "text-mustard" : time === "Afternoon" ? "text-terracotta" : time === "Evening" ? "text-blue" : time === "Night" ? "text-ink-secondary" : "text-ink-tertiary";
        return (
          <div key={time}>
            <div className="flex items-center gap-2 mb-1.5">
              <TimeSectionIcon time={time} />
              <p className={`text-xs font-medium uppercase tracking-wide ${timeColor}`}>{time}</p>
              <span className="text-ink-tertiary text-[10px]">{timeMeds.length}</span>
            </div>
            <div className="bg-surface border border-border-subtle rounded-[12px] divide-y divide-border-subtle overflow-hidden">
              {timeMeds.map((med) => (
                <MedicineRow key={med.id} medicine={med} parents={parents} onDelete={() => onDelete(med.id)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ConditionEditor({
  conditions,
  onChange,
  onSave,
  onCancel,
}: {
  conditions: string[];
  onChange: (c: string[]) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (c: string) => {
    onChange(conditions.includes(c) ? conditions.filter((x) => x !== c) : [...conditions, c]);
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed && !conditions.includes(trimmed)) {
      onChange([...conditions, trimmed]);
    }
    setCustomInput("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {CONDITIONS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            className={`px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[30px] ${
              conditions.includes(c)
                ? "bg-sage text-white border-sage"
                : "bg-white border-border text-ink-secondary hover:border-sage/50"
            }`}
          >
            {c}
          </button>
        ))}
        {/* Show custom conditions not in the preset list */}
        {conditions.filter((c) => !CONDITIONS.includes(c)).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => toggle(c)}
            className="px-2.5 py-1.5 rounded-[6px] text-xs font-medium border transition-colors min-h-[30px] bg-sage text-white border-sage"
          >
            {c} ×
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-3">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Other condition..."
          className="flex-1 px-3 py-1.5 bg-white border border-border rounded-[6px] text-xs text-ink focus:border-sage focus:outline-none min-h-[30px]"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          className="px-3 py-1.5 text-sage text-xs font-medium hover:bg-sage-light rounded-[6px] transition-colors disabled:opacity-40"
        >
          + Add
        </button>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-sage text-white font-medium rounded-[8px] text-sm min-h-[36px] hover:opacity-90 transition-opacity"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-2 text-ink-secondary font-medium rounded-[8px] text-sm min-h-[36px] hover:bg-sand transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  count,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 mb-3 group w-full text-left"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={`text-ink-tertiary transition-transform ${open ? "rotate-90" : ""}`}
      >
        <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-sm font-semibold text-ink uppercase tracking-wide">{title}</p>
      <span className="text-ink-tertiary text-xs md:text-sm bg-sand px-2 py-0.5 rounded-full">
        {count}
      </span>
    </button>
  );
}

/* ─── Medicine Form ─── */

function MedicineForm({
  parents,
  doctors,
  authFetch,
  onSubmit,
  onDoctorAdded,
  onCancel,
}: {
  parents: Parent[];
  doctors: Doctor[];
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onSubmit: (m: Partial<Medicine>) => void;
  onDoctorAdded: (d: Doctor) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timeOfDay, setTimeOfDay] = useState<string[]>([]);
  const [withFood, setWithFood] = useState(true);
  const [isLifelong, setIsLifelong] = useState(true);
  const [endDate, setEndDate] = useState("");
  const [parentId, setParentId] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [showNewDoctor, setShowNewDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState("");
  const [newDoctorSpecialty, setNewDoctorSpecialty] = useState("");
  const [listening, setListening] = useState<"name" | "dosage" | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const fieldRef = useRef<"name" | "dosage">("name");

  const [hasSpeech, setHasSpeech] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    setHasSpeech(!!(W.webkitSpeechRecognition || W.SpeechRecognition));
  }, []);

  const toggleTime = (t: string) => {
    setTimeOfDay((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  };

  const startVoice = (field: "name" | "dosage") => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        /* ignore */
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SpeechRecognitionCtor = W.webkitSpeechRecognition || W.SpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    fieldRef.current = field;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (last.isFinal) {
        const text = last[0].transcript.trim();
        if (text) {
          if (fieldRef.current === "name") setName((prev) => (prev ? prev + " " + text : text));
          else setDosage((prev) => (prev ? prev + " " + text : text));
        }
        setListening(null);
      }
    };

    recognition.onerror = () => setListening(null);
    recognition.onend = () => setListening(null);

    recognitionRef.current = recognition;
    setListening(field);
    recognition.start();
  };

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Add a medicine</p>
      <div className="space-y-4">
        <div className="relative">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Metformin, Amlodipine, Ecosprin"
            className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px] pr-12"
            autoFocus
          />
          {hasSpeech && (
            <button
              type="button"
              onClick={() => startVoice("name")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                listening === "name"
                  ? "bg-terracotta text-white animate-pulse"
                  : "bg-sand text-ink-tertiary hover:text-ink"
              }`}
              title="Voice input"
            >
              <MicIcon />
            </button>
          )}
        </div>
        <div className="relative">
          <input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            placeholder="e.g. 500mg once, 1 tablet twice daily"
            className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px] pr-12"
          />
          {hasSpeech && (
            <button
              type="button"
              onClick={() => startVoice("dosage")}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                listening === "dosage"
                  ? "bg-terracotta text-white animate-pulse"
                  : "bg-sand text-ink-tertiary hover:text-ink"
              }`}
              title="Voice input"
            >
              <MicIcon />
            </button>
          )}
        </div>
        <div>
          <p className="text-ink text-sm font-medium mb-2">Time of day</p>
          <div className="flex gap-2 md:gap-3">
            {[
              {
                label: "Morning",
                icon: MorningIcon,
                activeColor: "bg-mustard-light border-mustard text-mustard",
              },
              {
                label: "Afternoon",
                icon: AfternoonIcon,
                activeColor: "bg-terracotta-light border-terracotta text-terracotta",
              },
              {
                label: "Evening",
                icon: EveningIcon,
                activeColor: "bg-blue-light border-blue text-blue",
              },
              {
                label: "Night",
                icon: NightIcon,
                activeColor: "bg-sand border-ink-secondary text-ink-secondary",
              },
            ].map(({ label, icon: Icon, activeColor }) => (
              <button
                key={label}
                type="button"
                onClick={() => toggleTime(label)}
                className={`flex-1 flex flex-col items-center gap-1.5 px-2 py-3 rounded-[10px] border-2 transition-all min-h-[72px] md:min-h-[80px] ${
                  timeOfDay.includes(label)
                    ? activeColor
                    : "bg-white border-border text-ink-tertiary hover:border-sage/50"
                }`}
              >
                <Icon />
                <span className="text-[11px] md:text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-ink text-sm font-medium mb-2">Take with food?</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setWithFood(true)}
              className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-[10px] border-2 transition-all min-h-[72px] md:min-h-[80px] ${
                withFood
                  ? "bg-sage-light border-sage text-sage"
                  : "bg-white border-border text-ink-tertiary hover:border-sage/50"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M3 14C3 14 5 10 12 10C19 10 21 14 21 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M3 14H21V16C21 17.1046 20.1046 18 19 18H5C3.89543 18 3 17.1046 3 16V14Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle cx="8" cy="12" r="1" fill="currentColor" />
                <circle cx="12" cy="11" r="1" fill="currentColor" />
                <circle cx="16" cy="12" r="1" fill="currentColor" />
              </svg>
              <span className="text-xs md:text-sm font-medium">With food</span>
            </button>
            <button
              type="button"
              onClick={() => setWithFood(false)}
              className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-[10px] border-2 transition-all min-h-[72px] md:min-h-[80px] ${
                !withFood
                  ? "bg-blue-light border-blue text-blue"
                  : "bg-white border-border text-ink-tertiary hover:border-blue/50"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 4L5 2M17 4L19 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Empty stomach</span>
            </button>
          </div>
        </div>

        {/* Duration */}
        <div>
          <p className="text-ink text-sm font-medium mb-2">Duration</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setIsLifelong(true);
                setEndDate("");
              }}
              className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-[10px] border-2 transition-all min-h-[72px] md:min-h-[80px] ${
                isLifelong
                  ? "bg-sage-light border-sage text-sage"
                  : "bg-white border-border text-ink-tertiary hover:border-sage/50"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path
                  d="M5 12C5 9 7 7 9.5 7C11 7 12 8 12 8C12 8 13 7 14.5 7C17 7 19 9 19 12C19 15 17 17 14.5 17C13 17 12 16 12 16C12 16 11 17 9.5 17C7 17 5 15 5 12Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs md:text-sm font-medium">Lifelong</span>
            </button>
            <button
              type="button"
              onClick={() => setIsLifelong(false)}
              className={`flex-1 flex flex-col items-center gap-1.5 px-4 py-3 rounded-[10px] border-2 transition-all min-h-[72px] md:min-h-[80px] ${
                !isLifelong
                  ? "bg-blue-light border-blue text-blue"
                  : "bg-white border-border text-ink-tertiary hover:border-blue/50"
              }`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                <path d="M4 10H20" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 3V7M16 3V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Temporary</span>
            </button>
          </div>
          {!isLifelong && (
            <div className="mt-3">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
                placeholder="End date"
              />
            </div>
          )}
        </div>

        {/* Doctor selector */}
        <div>
          <p className="text-ink text-sm font-medium mb-2">Prescribed by</p>
          {!showNewDoctor ? (
            <div className="flex flex-wrap gap-2">
              {doctors.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedDoctorId(selectedDoctorId === d.id ? "" : d.id)}
                  className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] md:min-h-[44px] ${
                    selectedDoctorId === d.id
                      ? "bg-sage text-white border-sage"
                      : "bg-white border-border text-ink-secondary hover:border-sage/50"
                  }`}
                >
                  {d.name}
                  {d.specialty ? ` · ${d.specialty}` : ""}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewDoctor(true)}
                className="px-3 py-2 rounded-[8px] text-sm font-medium border border-dashed border-border text-ink-tertiary hover:border-sage hover:text-sage transition-colors min-h-[40px] md:min-h-[44px]"
              >
                + New doctor
              </button>
            </div>
          ) : (
            <div className="flex gap-2 items-end">
              <input
                value={newDoctorName}
                onChange={(e) => setNewDoctorName(e.target.value)}
                placeholder="Doctor name"
                className="flex-1 px-3 py-2.5 bg-white border-2 border-border rounded-[8px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px]"
                autoFocus
              />
              <input
                value={newDoctorSpecialty}
                onChange={(e) => setNewDoctorSpecialty(e.target.value)}
                placeholder="Specialty"
                className="w-[120px] px-3 py-2.5 bg-white border-2 border-border rounded-[8px] text-ink text-sm focus:border-sage focus:outline-none min-h-[44px]"
              />
              <button
                type="button"
                onClick={async () => {
                  if (!newDoctorName.trim()) return;
                  const res = await authFetch("/api/vault/doctors", {
                    method: "POST",
                    body: JSON.stringify({
                      name: newDoctorName.trim(),
                      specialty: newDoctorSpecialty.trim() || null,
                      parent_id: parentId || null,
                    }),
                  });
                  if (res.ok) {
                    const doc = await res.json();
                    onDoctorAdded(doc);
                    setSelectedDoctorId(doc.id);
                    setShowNewDoctor(false);
                    setNewDoctorName("");
                    setNewDoctorSpecialty("");
                  }
                }}
                disabled={!newDoctorName.trim()}
                className="px-3 py-2.5 bg-sage text-white font-medium rounded-[8px] text-sm min-h-[44px] hover:opacity-90 disabled:opacity-40"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowNewDoctor(false)}
                className="px-2 py-2.5 text-ink-tertiary text-sm min-h-[44px]"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
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
              const doc = doctors.find((d) => d.id === selectedDoctorId);
              onSubmit({
                name: name.trim(),
                dosage: dosage.trim() || null,
                time_of_day: timeOfDay,
                with_food: withFood,
                is_lifelong: isLifelong,
                end_date: !isLifelong && endDate ? endDate : null,
                prescribed_by: doc?.name || null,
                parent_id: parentId || null,
              });
            }}
            disabled={!name.trim()}
            className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save medicine
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

/* ─── Medicine Row ─── */

function MedicineRow({
  medicine,
  parents,
  onDelete,
  muted,
}: {
  medicine: Medicine;
  parents: Parent[];
  onDelete: () => void;
  muted?: boolean;
}) {
  const parent = parents.find((p) => p.id === medicine.parent_id);

  const durationLabel = medicine.is_lifelong
    ? "Lifelong"
    : medicine.end_date
    ? `Until ${new Date(medicine.end_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
    : null;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 group ${muted ? "opacity-60" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-ink text-sm md:text-base truncate">{medicine.name}</p>
          {medicine.dosage && (
            <span className="text-ink-secondary text-xs md:text-sm shrink-0">{medicine.dosage}</span>
          )}
          {parent && (
            <span className="text-[10px] md:text-xs px-1.5 py-0.5 bg-sage-light text-sage rounded-full font-medium shrink-0">
              {parent.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-x-3 text-xs md:text-sm text-ink-tertiary flex-wrap">
          <span className="flex items-center gap-1">
            {medicine.with_food ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-sage">
                <path
                  d="M3 14C3 14 5 10 12 10C19 10 21 14 21 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 14H21V16C21 17 20 18 19 18H5C4 18 3 17 3 16V14Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-blue">
                <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M12 8V12L14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            )}
            {medicine.with_food ? "With food" : "Empty stomach"}
          </span>
          {durationLabel && (
            <span className="text-ink-tertiary text-[11px] md:text-xs">
              {durationLabel}
            </span>
          )}
          {medicine.prescribed_by && <span>by {medicine.prescribed_by}</span>}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary opacity-0 group-hover:opacity-100 hover:bg-terracotta-light hover:text-terracotta transition-all shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/* ─── Event Form ─── */

function EventForm({
  parents,
  onSubmit,
  onCancel,
}: {
  parents: Parent[];
  onSubmit: (e: Partial<MedicalEvent>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("Surgery");
  const [eventDate, setEventDate] = useState("");
  const [hospital, setHospital] = useState("");
  const [doctor, setDoctor] = useState("");
  const [notes, setNotes] = useState("");
  const [parentId, setParentId] = useState("");

  return (
    <div className="bg-surface border border-border-subtle rounded-[14px] p-5 md:p-6 mb-6 animate-[fadeIn_0.2s_ease]">
      <p className="font-semibold text-ink text-base md:text-lg mb-4">Add a procedure</p>
      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Knee replacement, Cataract surgery"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
          autoFocus
        />
        <div>
          <p className="text-ink text-sm font-medium mb-2">Type</p>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`px-3 py-2 rounded-[8px] text-sm font-medium border transition-colors min-h-[40px] ${
                  eventType === t
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
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <input
          value={hospital}
          onChange={(e) => setHospital(e.target.value)}
          placeholder="Hospital"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <input
          value={doctor}
          onChange={(e) => setDoctor(e.target.value)}
          placeholder="Doctor"
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none min-h-[48px]"
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full px-4 py-3 bg-white border-2 border-border rounded-[10px] text-ink text-base focus:border-sage focus:outline-none resize-none"
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
              if (!title.trim()) return;
              onSubmit({
                title: title.trim(),
                event_type: eventType,
                event_date: eventDate || null,
                hospital: hospital.trim() || null,
                doctor: doctor.trim() || null,
                notes: notes.trim() || null,
                parent_id: parentId || null,
              });
            }}
            disabled={!title.trim()}
            className="px-6 py-3 bg-sage text-white font-medium rounded-[10px] text-base min-h-[48px] md:min-h-[52px] hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            Save procedure
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

/* ─── Event Row ─── */

function EventRow({
  event,
  parents,
  onDelete,
}: {
  event: MedicalEvent;
  parents: Parent[];
  onDelete: () => void;
}) {
  const parent = parents.find((p) => p.id === event.parent_id);

  const typeColors: Record<string, string> = {
    Surgery: "bg-terracotta-light text-terracotta",
    Procedure: "bg-blue-light text-blue",
    Hospitalization: "bg-mustard-light text-mustard",
    Diagnosis: "bg-sage-light text-sage",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-ink text-sm md:text-base truncate">{event.title}</p>
          <span
            className={`text-[10px] md:text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0 ${
              typeColors[event.event_type] || "bg-sand text-ink-tertiary"
            }`}
          >
            {event.event_type}
          </span>
          {parent && (
            <span className="text-[10px] md:text-xs px-1.5 py-0.5 bg-sage-light text-sage rounded-full font-medium shrink-0">
              {parent.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-x-3 text-xs md:text-sm text-ink-tertiary flex-wrap">
          {event.event_date && (
            <span>
              {new Date(event.event_date).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
          {event.hospital && <span>{event.hospital}</span>}
          {event.doctor && <span>Dr. {event.doctor}</span>}
        </div>
        {event.notes && (
          <p className="text-xs text-ink-tertiary mt-0.5 truncate">{event.notes}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="flex items-center justify-center w-8 h-8 rounded-full text-ink-tertiary opacity-0 group-hover:opacity-100 hover:bg-terracotta-light hover:text-terracotta transition-all shrink-0"
      >
        <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 4H12M5 4V2H9V4M5 7V11M9 7V11M3 4L4 13H10L11 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/* ─── Shared icons ─── */

function TimeSectionIcon({ time }: { time: string }) {
  const color =
    time === "Morning"
      ? "text-mustard"
      : time === "Afternoon"
      ? "text-terracotta"
      : time === "Evening"
      ? "text-blue"
      : time === "Night"
      ? "text-ink-secondary"
      : "text-ink-tertiary";

  if (time === "Morning") return <span className={color}><MorningIcon /></span>;
  if (time === "Afternoon") return <span className={color}><AfternoonIcon /></span>;
  if (time === "Evening") return <span className={color}><EveningIcon /></span>;
  if (time === "Night") return <span className={color}><NightIcon /></span>;
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" className={color}>
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7 4V7L9 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="5" y="1" width="4" height="7" rx="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3 6C3 8.20914 4.79086 10 7 10C9.20914 10 11 8.20914 11 6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M7 10V13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Time-of-day icons for the form ─── */

function MorningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 6V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6.34 9.34L7.76 10.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17.66 9.34L16.24 10.76" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 14H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 19H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AfternoonIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 3V5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.64 5.64L7.05 7.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16.95 16.95L18.36 18.36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 12H5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M19 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.64 18.36L7.05 16.95" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16.95 7.05L18.36 5.64" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function EveningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="15" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10L8.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 10L15.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 20H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function NightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M20.5 13.5C19.5 14.5 18 15 16.5 15C12.9 15 10 12.1 10 8.5C10 7 10.5 5.5 11.5 4.5C7.3 5.2 4 8.9 4 13.3C4 18.1 7.9 22 12.7 22C17.1 22 20.8 18.7 21.5 14.5C21.2 14.2 20.8 13.8 20.5 13.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="5" r="1" fill="currentColor" />
      <circle cx="20" cy="8" r="0.7" fill="currentColor" />
    </svg>
  );
}
