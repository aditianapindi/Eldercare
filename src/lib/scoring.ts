import type { DiagnosticAnswer } from "./types";

const POINTS: Record<DiagnosticAnswer, number> = {
  high: 2,
  mid: 1,
  low: 0,
};

export function calculateDiagnosticScore(
  answers: Record<string, DiagnosticAnswer>
): number {
  const values = Object.values(answers);
  if (values.length === 0) return 0;
  const total = values.reduce((sum, answer) => sum + POINTS[answer], 0);
  // Max possible = 10 (5 questions × 2 points)
  return total;
}

export function getBlindSpots(
  answers: Record<string, DiagnosticAnswer>,
  areaMap: Record<string, string>
): string[] {
  return Object.entries(answers)
    .filter(([, value]) => value === "low" || value === "mid")
    .map(([key]) => areaMap[key])
    .filter(Boolean);
}

// Journey-framed labels — no judgment, only direction
export function getScoreLabel(score: number): string {
  if (score <= 2) return "Just getting started";
  if (score <= 4) return "Building awareness";
  if (score <= 6) return "Making progress";
  if (score <= 8) return "Well on your way";
  return "Truly prepared";
}

// Encouraging subtext for each score range
export function getScoreSubtext(score: number): string {
  if (score <= 2)
    return "You're asking the questions most families never do. That's the first step.";
  if (score <= 4)
    return "You know more than you think. A few conversations can close the biggest gaps.";
  if (score <= 6)
    return "You've got a solid foundation. The areas below will help you go further.";
  if (score <= 8)
    return "Your family is ahead of most. Small steps from here make a real difference.";
  return "This is rare. Your parents are lucky to have someone this prepared.";
}

// Always warm — no red/punitive colors for low scores
export function getScoreColor(): string {
  return "sage";
}
