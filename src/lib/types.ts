// Diagnostic (5 quick questions)
export type DiagnosticAnswer = "high" | "mid" | "low";

export interface DiagnosticQuestion {
  id: string;
  question: string;
  options: { label: string; value: DiagnosticAnswer }[];
  blindSpotArea: string;
}

export interface DiagnosticResult {
  score: number; // 0-10
  answers: Record<string, DiagnosticAnswer>;
  blindSpots: string[];
}

// Full assessment sections
export interface AssessmentSection {
  id: string;
  title: string;
  description: string;
  questionCount: number;
}

// Parent basics
export interface ParentInfo {
  location: string;
  parent1Age: string;
  parent2Age: string;
  livingSituation: "alone" | "together" | "with-child" | "assisted" | "";
}

// Health
export interface HealthInfo {
  conditions: string[];
  conditionsOther: string;
  medicationCount: "none" | "1-3" | "4-7" | "8-plus" | "dont-know" | "";
  hasInsurance: "yes" | "no" | "dont-know" | "";
  insuranceType: string[];
}

// Monthly expenses
export interface ExpenseItem {
  category: string;
  known: boolean;
  amount: string; // empty string if unknown
}

export interface ExpensesInfo {
  items: ExpenseItem[];
}

// Financial blind spots
export type BlindSpotStatus = "yes" | "no" | "not-sure";

export interface FinancialBlindSpot {
  id: string;
  label: string;
  description: string;
  status: BlindSpotStatus;
}

// Siblings
export interface SiblingInfo {
  count: "0" | "1" | "2" | "3-plus" | "";
  whoHandlesCare: "me" | "shared" | "other-sibling" | "no-one" | "";
  costSplitMethod: "equal" | "proportional" | "one-person" | "informal" | "none" | "";
  costSplitSatisfaction: "works-well" | "tension" | "conflict" | "";
}

// Emergency readiness
export interface EmergencyInfo {
  knowsHospital: "yes" | "no" | "";
  hasEmergencyContacts: "yes" | "some" | "no" | "";
  hasPOA: "yes" | "no" | "dont-know" | "";
  hasABHA: "yes" | "no" | "dont-know" | "";
}

// Open concern
export interface ConcernInfo {
  openText: string;
}

// Complete assessment
export interface FullAssessment {
  sessionId: string;
  diagnosticAnswers: Record<string, DiagnosticAnswer>;
  diagnosticScore: number;
  parents: ParentInfo;
  health: HealthInfo;
  expenses: ExpensesInfo;
  financialBlindSpots: FinancialBlindSpot[];
  siblings: SiblingInfo;
  emergency: EmergencyInfo;
  concern: ConcernInfo;
  createdAt: string;
}

// Generated report
export interface CareReport {
  id: string;
  sessionId: string;
  score: number;
  blindSpotCount: number;
  blindSpotAreas: string[];
  monthlyCostEstimate: { low: number; high: number };
  siblingSplitView: string | null;
  riskAlerts: { title: string; stat: string; description: string }[];
  priorityActions: { title: string; description: string; urgency: "high" | "medium" | "low" }[];
  personalizedInsight: string;
  careTimeline: string;
  biggestExposure: string;
  comparativeContext: string;
  createdAt: string;
}
