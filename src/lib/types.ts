// Shared domain & engine types used across server engines and UI.

export type Severity = "info" | "positive" | "warning" | "critical";

export type Evidence = {
  label: string;
  value: string;
  detail?: string;
};

export type SubScore = {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1
  detail: string;
};

export type ScoreResult = {
  score: number; // 0-100
  label: string;
  summary: string;
  subScores: SubScore[];
  evidence: Evidence[];
};

export type InsightItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  severity: Severity;
  evidence: Evidence[];
  confidence: number; // 0-1
  route?: string;
  action?: string;
};

export type RecommendationItem = {
  id: string;
  title: string;
  explanation: string;
  evidence: Evidence[];
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  alternatives: string[];
  category: string;
};

export type AllocationSlice = {
  name: string;
  value: number; // amount
  pct: number; // 0-100
  color: string;
};

export type SeriesPoint = { label: string; value?: number; [k: string]: string | number | undefined };

// ---- Loaded financial picture (from Prisma, shaped for engines) ----

export type HoldingView = {
  id: string;
  symbol: string;
  name: string;
  assetClass: string;
  sector: string;
  marketCap: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  invested: number;
  value: number;
  pnl: number;
  pnlPct: number;
};

export type TransactionView = {
  id: string;
  date: Date;
  direction: string;
  type: string;
  amount: number;
  category: string;
  merchant: string;
  symbol?: string | null;
};

export type GoalView = {
  id: string;
  name: string;
  type: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  priority: number;
};

export type SipView = {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  frequency: string;
  startDate: Date;
  goalId?: string | null;
};

export type PriceSeries = { symbol: string; prices: { date: Date; close: number }[] };

export type FinancialPicture = {
  user: { id: string; name: string; monthlyIncome: number; riskProfile: string };
  holdings: HoldingView[];
  transactions: TransactionView[];
  goals: GoalView[];
  sips: SipView[];
  prices: Record<string, { date: Date; close: number }[]>; // by symbol
  fundMeta: Record<string, { holdings?: string[]; style?: string; expense?: number; nav?: number }>;
};
