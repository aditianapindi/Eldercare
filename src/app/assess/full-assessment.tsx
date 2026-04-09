"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosticAnswer, ParentInfo, ConcernInfo } from "@/lib/types";

interface Props {
  diagnosticAnswers: Record<string, DiagnosticAnswer>;
  diagnosticScore: number;
  isGenerating: boolean;
  onSubmit: () => void;
}

export function FullAssessmentForm({ diagnosticAnswers, diagnosticScore, isGenerating, onSubmit }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [parents, setParents] = useState<ParentInfo>({
    location: "",
    parent1Age: "",
    parent2Age: "",
    livingSituation: "",
  });
  const [siblingCount, setSiblingCount] = useState("");
  const [concern, setConcern] = useState<ConcernInfo>({ openText: "" });

  const handleSubmit = async () => {
    setSubmitting(true);
    onSubmit();

    const sessionId = crypto.randomUUID();
    const payload = {
      sessionId,
      diagnosticAnswers,
      diagnosticScore,
      parents,
      siblings: { count: siblingCount },
      concern,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Report generation failed");

      const { reportId, report } = await res.json();
      sessionStorage.setItem(`report-${reportId}`, JSON.stringify(report));
      sessionStorage.setItem(`assessment-${reportId}`, JSON.stringify(payload));
      router.push(`/report/${reportId}`);
    } catch {
      const mockId = sessionId.slice(0, 8);
      sessionStorage.setItem(`assessment-${mockId}`, JSON.stringify(payload));
      router.push(`/report/${mockId}`);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col px-6 py-12 md:px-12 lg:px-24 relative overflow-hidden">
      {/* Soft background */}
      <div className="absolute -bottom-[200px] -right-[200px] w-[500px] h-[500px] rounded-full bg-sage/[0.04] pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-[600px] animate-[fadeIn_0.3s_ease]">
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sage">
            <path d="M3 13C3 13 5 8 9 5C9 5 11 3 13 3C13 3 13 6 11 9C8 11 3 13 3 13Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-ink-tertiary text-sm">Almost there</p>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-[clamp(24px,5vw,32px)] leading-[1.2] font-medium text-ink mb-2">
          A few details to personalize your care plan
        </h2>
        <p className="text-ink-secondary text-base mb-10">
          This helps us tailor the report to your family&apos;s situation.
        </p>

        {/* Parents location + ages */}
        <label className="block mb-5">
          <span className="text-ink font-medium text-base mb-1.5 block">Where do your parents live?</span>
          <input
            type="text"
            value={parents.location}
            onChange={(e) => setParents({ ...parents, location: e.target.value })}
            placeholder="City, State"
            className="w-full px-4 py-3 bg-surface border-2 border-border rounded-[10px] text-ink text-lg focus:border-sage focus:outline-none transition-colors min-h-[52px]"
          />
        </label>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <label className="block">
            <span className="text-ink font-medium text-base mb-1.5 block">Parent 1 age</span>
            <input
              type="number"
              value={parents.parent1Age}
              onChange={(e) => setParents({ ...parents, parent1Age: e.target.value })}
              placeholder="e.g. 68"
              className="w-full px-4 py-3 bg-surface border-2 border-border rounded-[10px] text-ink text-lg focus:border-sage focus:outline-none transition-colors min-h-[52px]"
            />
          </label>
          <label className="block">
            <span className="text-ink font-medium text-base mb-1.5 block">Parent 2 age</span>
            <input
              type="number"
              value={parents.parent2Age}
              onChange={(e) => setParents({ ...parents, parent2Age: e.target.value })}
              placeholder="e.g. 65"
              className="w-full px-4 py-3 bg-surface border-2 border-border rounded-[10px] text-ink text-lg focus:border-sage focus:outline-none transition-colors min-h-[52px]"
            />
          </label>
        </div>

        {/* Living situation */}
        <fieldset className="mb-6">
          <legend className="text-ink font-medium text-base mb-3">Living situation</legend>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Living alone", value: "alone" },
              { label: "Together (couple)", value: "together" },
              { label: "With a child", value: "with-child" },
              { label: "Assisted living", value: "assisted" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setParents({ ...parents, livingSituation: opt.value as ParentInfo["livingSituation"] })}
                className={`px-5 py-3 rounded-[10px] text-base font-medium transition-all border-2 min-h-[48px] ${
                  parents.livingSituation === opt.value
                    ? "bg-sage text-white border-sage"
                    : "bg-surface border-border text-ink hover:border-sage/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Sibling count */}
        <fieldset className="mb-6">
          <legend className="text-ink font-medium text-base mb-3">How many siblings do you have?</legend>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "None (only child)", value: "0" },
              { label: "1", value: "1" },
              { label: "2", value: "2" },
              { label: "3 or more", value: "3-plus" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSiblingCount(opt.value)}
                className={`px-5 py-3 rounded-[10px] text-base font-medium transition-all border-2 min-h-[48px] ${
                  siblingCount === opt.value
                    ? "bg-sage text-white border-sage"
                    : "bg-surface border-border text-ink hover:border-sage/50"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Open concern */}
        <label className="block mb-8">
          <span className="font-[family-name:var(--font-display)] text-xl font-medium text-ink block mb-2">
            What keeps you up at night about your parents?
          </span>
          <span className="text-ink-tertiary text-base block mb-3">
            Optional — but it helps us make the report personal to you.
          </span>
          <textarea
            value={concern.openText}
            onChange={(e) => setConcern({ openText: e.target.value })}
            rows={4}
            placeholder="e.g. I worry about what happens if one of them falls when nobody's around..."
            className="w-full px-4 py-3 bg-surface border-2 border-border rounded-[10px] text-ink text-lg focus:border-sage focus:outline-none transition-colors resize-none"
          />
        </label>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting || isGenerating}
          className="w-full px-8 py-4 bg-sage text-white text-lg font-medium rounded-[10px] hover:opacity-90 transition-opacity min-h-[52px] disabled:opacity-60"
        >
          {submitting || isGenerating
            ? "Putting together your care plan..."
            : "See your care plan"}
        </button>
      </div>
    </main>
  );
}
