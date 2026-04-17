export interface CarePlanStep {
  key: string;
  label: string;
  href: string;
  nextHint: string; // shown after saving on this page
}

export const CARE_PLAN_STEPS: CarePlanStep[] = [
  { key: "doctors", label: "Add their first doctor", href: "/vault/doctors", nextHint: "Next up: Add one medicine" },
  { key: "medicines", label: "Add one medicine", href: "/vault/medicines", nextHint: "Next up: Add an emergency contact" },
  { key: "contacts", label: "Add an emergency contact", href: "/vault/contacts", nextHint: "Next up: List one financial asset" },
  { key: "assets", label: "List one financial asset", href: "/vault/assets", nextHint: "You're all set! Head back to your care plan" },
];

/** Given the current page key, return the next step (or null if last). */
export function getNextStep(currentKey: string): CarePlanStep | null {
  const idx = CARE_PLAN_STEPS.findIndex((s) => s.key === currentKey);
  if (idx === -1 || idx >= CARE_PLAN_STEPS.length - 1) return null;
  return CARE_PLAN_STEPS[idx + 1];
}
