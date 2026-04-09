"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { diagnosticQuestions } from "@/lib/questions";
import { calculateDiagnosticScore } from "@/lib/scoring";
import type { DiagnosticAnswer, ConcernInfo } from "@/lib/types";

const reassurances: Record<string, string> = {
  health: "Most families piece this together over time.",
  contacts: "You can sort this out with one phone call.",
  finances: "The hardest conversation — and the most common gap.",
  legal: "Less than 2% of Indian families have this sorted.",
  coordination: "Even asking puts you ahead of most families.",
};

export default function AssessPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, DiagnosticAnswer>>({});
  const [location, setLocation] = useState("");
  const [parent1Age, setParent1Age] = useState("");
  const [parent2Age, setParent2Age] = useState("");
  const [livingSituation, setLivingSituation] = useState("");
  const [siblingCount, setSiblingCount] = useState("");
  const [concern, setConcern] = useState<ConcernInfo>({ openText: "" });
  const [submitting, setSubmitting] = useState(false);

  const answeredAll = diagnosticQuestions.every((q) => answers[q.id]);
  const score = calculateDiagnosticScore(answers);

  const handleSubmit = async () => {
    setSubmitting(true);

    const sessionId = crypto.randomUUID();
    const payload = {
      sessionId,
      diagnosticAnswers: answers,
      diagnosticScore: score,
      parents: {
        location,
        parent1Age,
        parent2Age,
        livingSituation,
      },
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
    <main className="min-h-dvh relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-[150px] -right-[150px] w-[400px] h-[400px] rounded-full bg-sage/[0.05]" />
        <div className="absolute bottom-[20%] -left-[100px] w-[300px] h-[300px] rounded-full bg-mustard/[0.03]" />
      </div>

      <div className="relative px-6 py-10 md:px-12 md:py-16 max-w-[640px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-sage">
            <path d="M3 13C3 13 5 8 9 5C9 5 11 3 13 3C13 3 13 6 11 9C8 11 3 13 3 13Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-ink-tertiary text-sm uppercase tracking-wide">GetSukoon</p>
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl leading-[1.2] font-medium text-ink mb-1">
          Five questions most families never discuss
        </h1>
        <p className="text-ink-secondary text-sm md:text-base mb-8">
          Answer honestly — no wrong answers. This helps us find where to focus.
        </p>

        {/* All 5 diagnostic questions — compact with horizontal pills */}
        <div className="space-y-6 mb-8">
          {diagnosticQuestions.map((question, qi) => {
            const selected = answers[question.id];
            const showReassurance = selected && (selected === "low" || selected === "mid");

            return (
              <div key={question.id}>
                <p className="text-ink font-medium text-base md:text-lg mb-2.5 leading-snug">
                  <span className="text-ink-tertiary mr-1.5">{qi + 1}.</span>
                  {question.question}
                </p>
                <div className="flex flex-wrap gap-2">
                  {question.options.map((option) => {
                    const isSelected = selected === option.value;
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option.value }))
                        }
                        className={`px-4 py-2.5 rounded-[10px] text-sm md:text-base font-medium transition-all border-2 min-h-[40px] md:min-h-[44px] ${
                          isSelected
                            ? "bg-sage text-white border-sage"
                            : "bg-surface border-border text-ink-secondary hover:border-sage/50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {showReassurance && (
                  <p className="mt-2 text-ink-tertiary text-xs italic pl-1 animate-[fadeIn_0.3s_ease]">
                    {reassurances[question.id]}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Compact personalization — no section header, just a natural continuation */}
        {answeredAll && (
          <div className="animate-[fadeIn_0.3s_ease] border-t border-border-subtle pt-6 space-y-4 mb-6">
            {/* Row 1: City + Ages */}
            <div className="flex gap-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Parents' city"
                className="flex-1 min-w-0 px-3 py-2.5 bg-surface border-2 border-border rounded-[10px] text-ink text-sm md:text-base focus:border-sage focus:outline-none min-h-[44px] md:min-h-[48px]"
              />
              <input
                type="number"
                value={parent1Age}
                onChange={(e) => setParent1Age(e.target.value)}
                placeholder="Age"
                className="w-[72px] md:w-[80px] px-3 py-2.5 bg-surface border-2 border-border rounded-[10px] text-ink text-sm md:text-base focus:border-sage focus:outline-none min-h-[44px] md:min-h-[48px]"
              />
              <input
                type="number"
                value={parent2Age}
                onChange={(e) => setParent2Age(e.target.value)}
                placeholder="Age"
                className="w-[72px] md:w-[80px] px-3 py-2.5 bg-surface border-2 border-border rounded-[10px] text-ink text-sm md:text-base focus:border-sage focus:outline-none min-h-[44px] md:min-h-[48px]"
              />
            </div>

            {/* Row 2: Living situation pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-ink-tertiary text-xs md:text-sm self-center mr-1">Living</span>
              {[
                { label: "Alone", value: "alone" },
                { label: "Together", value: "together" },
                { label: "With child", value: "with-child" },
                { label: "Assisted", value: "assisted" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLivingSituation(livingSituation === opt.value ? "" : opt.value)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs md:text-sm font-medium border transition-colors min-h-[32px] md:min-h-[36px] ${
                    livingSituation === opt.value
                      ? "bg-sage text-white border-sage"
                      : "bg-surface border-border text-ink-secondary hover:border-sage/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Row 3: Siblings pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-ink-tertiary text-xs md:text-sm self-center mr-1">Siblings</span>
              {[
                { label: "None", value: "0" },
                { label: "1", value: "1" },
                { label: "2", value: "2" },
                { label: "3+", value: "3-plus" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSiblingCount(siblingCount === opt.value ? "" : opt.value)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs md:text-sm font-medium border transition-colors min-h-[32px] md:min-h-[36px] ${
                    siblingCount === opt.value
                      ? "bg-sage text-white border-sage"
                      : "bg-surface border-border text-ink-secondary hover:border-sage/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Row 4: Concern */}
            <textarea
              value={concern.openText}
              onChange={(e) => setConcern({ openText: e.target.value })}
              rows={2}
              placeholder="What keeps you up at night about your parents? (optional — makes the report personal)"
              className="w-full px-3 py-2.5 bg-surface border-2 border-border rounded-[10px] text-ink text-sm md:text-base focus:border-sage focus:outline-none resize-none"
            />

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full px-8 py-4 bg-sage text-white text-base md:text-lg font-medium rounded-[12px] hover:opacity-90 transition-opacity min-h-[48px] md:min-h-[52px] disabled:opacity-60 shadow-[0_2px_12px_rgba(122,139,111,0.2)]"
            >
              {submitting ? "Putting together your care plan..." : "See your care plan"}
            </button>
            <p className="text-center text-ink-tertiary text-xs mt-2">
              Free · No account needed
            </p>
          </div>
        )}

        {/* Prompt to answer all questions */}
        {!answeredAll && (
          <div className="text-center py-4 border-t border-border-subtle">
            <p className="text-ink-tertiary text-sm md:text-base">
              Answer all 5 questions to get your care plan.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
