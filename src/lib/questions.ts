import type { DiagnosticQuestion, AssessmentSection, FinancialBlindSpot } from "./types";

export const diagnosticQuestions: DiagnosticQuestion[] = [
  {
    id: "health",
    question:
      "How well do you know your parents' daily health routine — medications, doctor visits, conditions?",
    options: [
      { label: "I'm on top of it", value: "high" },
      { label: "I know the basics", value: "mid" },
      { label: "Not really", value: "low" },
    ],
    blindSpotArea: "Health awareness",
  },
  {
    id: "contacts",
    question:
      "If something happened to your parents, do you know who they depend on day-to-day — their doctor, pharmacy, neighbors, helpers?",
    options: [
      { label: "Yes, I have their contacts", value: "high" },
      { label: "I know some", value: "mid" },
      { label: "I'd have to ask around", value: "low" },
    ],
    blindSpotArea: "Support network",
  },
  {
    id: "finances",
    question:
      "Do you have a clear picture of your parents' finances — accounts, insurance, pensions, property?",
    options: [
      { label: "Yes, we've discussed it", value: "high" },
      { label: "Bits and pieces", value: "mid" },
      { label: "It's never come up", value: "low" },
    ],
    blindSpotArea: "Financial visibility",
  },
  {
    id: "legal",
    question:
      "Has your family sorted out the legal basics — a will, nominees on accounts, power of attorney?",
    options: [
      { label: "Mostly handled", value: "high" },
      { label: "Started but incomplete", value: "mid" },
      { label: "Not yet", value: "low" },
    ],
    blindSpotArea: "Legal preparedness",
  },
  {
    id: "coordination",
    question:
      "Is there a system for how your family splits care responsibilities and costs?",
    options: [
      { label: "We've worked it out", value: "high" },
      { label: "It's informal", value: "mid" },
      { label: "It's a sore point", value: "low" },
    ],
    blindSpotArea: "Family coordination",
  },
];

// Only-child variant for question 5
export const onlyChildCoordinationQuestion: DiagnosticQuestion = {
  id: "coordination",
  question:
    "Do you have a plan for managing your parents' care costs long-term?",
  options: [
    { label: "Yes, I've planned ahead", value: "high" },
    { label: "Somewhat", value: "mid" },
    { label: "Not yet", value: "low" },
  ],
  blindSpotArea: "Care planning",
};

export const assessmentSections: AssessmentSection[] = [
  {
    id: "parents",
    title: "Your parents",
    description: "Location, ages, living situation",
    questionCount: 4,
  },
  {
    id: "health",
    title: "Health",
    description: "Conditions, medications, insurance",
    questionCount: 3,
  },
  {
    id: "expenses",
    title: "Monthly expenses",
    description: "What they spend, what you're not sure about",
    questionCount: 8,
  },
  {
    id: "blindspots",
    title: "Financial blind spots",
    description: "What exists, what you're not sure about",
    questionCount: 7,
  },
  {
    id: "siblings",
    title: "Family coordination",
    description: "Who handles what, how costs are split",
    questionCount: 3,
  },
  {
    id: "emergency",
    title: "Emergency readiness",
    description: "Hospital, contacts, legal documents",
    questionCount: 4,
  },
  {
    id: "concern",
    title: "One last thing",
    description: "What keeps you up at night about your parents?",
    questionCount: 1,
  },
];

export const defaultExpenseItems = [
  { category: "Rent / housing maintenance", known: false, amount: "" },
  { category: "Electricity", known: false, amount: "" },
  { category: "Water", known: false, amount: "" },
  { category: "Phone / internet", known: false, amount: "" },
  { category: "Groceries / household help", known: false, amount: "" },
  { category: "Medical / medicines", known: false, amount: "" },
  { category: "Insurance premiums", known: false, amount: "" },
  { category: "Other recurring", known: false, amount: "" },
];

export const defaultFinancialBlindSpots: FinancialBlindSpot[] = [
  {
    id: "bank-accounts",
    label: "Bank accounts",
    description: "Savings, current, FDs across all banks",
    status: "not-sure",
  },
  {
    id: "insurance",
    label: "Life insurance (LIC, etc.)",
    description: "Active policies, premium amounts, nominees",
    status: "not-sure",
  },
  {
    id: "health-insurance",
    label: "Health insurance",
    description: "Policy details, network hospitals, renewal dates",
    status: "not-sure",
  },
  {
    id: "pension",
    label: "Pension / PF",
    description: "EPF, PPF, NPS, pension payments",
    status: "not-sure",
  },
  {
    id: "property",
    label: "Property documents",
    description: "Ownership papers, tax receipts, mutation status",
    status: "not-sure",
  },
  {
    id: "investments",
    label: "Investments",
    description: "Mutual funds, stocks, post office schemes",
    status: "not-sure",
  },
  {
    id: "will",
    label: "Will",
    description: "Written, registered, accessible to family",
    status: "not-sure",
  },
];
