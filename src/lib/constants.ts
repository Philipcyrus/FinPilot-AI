// Shared domain constants for FinPilot AI.

export const APP_NAME = "FinPilot AI";
export const APP_TAGLINE = "Your AI Wealth Operating System";

export const SPENDING_CATEGORIES = [
  "Housing",
  "Food",
  "Travel",
  "Transportation",
  "Shopping",
  "Utilities",
  "Entertainment",
  "Education",
  "Healthcare",
  "Subscriptions",
  "Other",
] as const;
export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  Housing: "#6366f1",
  Food: "#f59e0b",
  Travel: "#06b6d4",
  Transportation: "#10b981",
  Shopping: "#ec4899",
  Utilities: "#8b5cf6",
  Entertainment: "#f43f5e",
  Education: "#3b82f6",
  Healthcare: "#14b8a6",
  Subscriptions: "#a855f7",
  Other: "#94a3b8",
};

// Keyword -> category map for rule-based transaction classification.
export const MERCHANT_CATEGORY_RULES: Array<[RegExp, SpendingCategory]> = [
  [/rent|landlord|housing|maintenance|society|emi|home loan/i, "Housing"],
  [/swiggy|zomato|grocer|bigbasket|blinkit|zepto|restaurant|cafe|food|dmart|more retail/i, "Food"],
  [/uber|ola|rapido|metro|irctc|petrol|fuel|hpcl|bpcl|iocl|parking|fastag/i, "Transportation"],
  [/makemytrip|goibibo|indigo|vistara|airbnb|oyo|flight|hotel|travel|booking\.com/i, "Travel"],
  [/amazon|flipkart|myntra|ajio|nykaa|shopping|mall|lifestyle|reliance trends/i, "Shopping"],
  [/electricity|water|gas|broadband|airtel|jio|vi |tata power|adani|bescom|bill/i, "Utilities"],
  [/bookmyshow|pvr|inox|movie|game|steam|playstation|concert/i, "Entertainment"],
  [/udemy|coursera|byju|unacademy|tuition|course|school|college|exam/i, "Education"],
  [/apollo|pharmacy|hospital|clinic|medical|practo|1mg|netmeds|diagnostic/i, "Healthcare"],
  [/netflix|prime|spotify|hotstar|disney|youtube premium|subscription|icloud|google one|notion|chatgpt/i, "Subscriptions"],
];

export const SECTOR_COLORS: Record<string, string> = {
  Technology: "#6366f1",
  Financials: "#10b981",
  Energy: "#f59e0b",
  Consumer: "#ec4899",
  Healthcare: "#14b8a6",
  Industrials: "#8b5cf6",
  Materials: "#f43f5e",
  Communication: "#06b6d4",
  Utilities: "#a855f7",
  Other: "#94a3b8",
  Diversified: "#3b82f6",
};

export const ASSET_CLASS_LABEL: Record<string, string> = {
  equity: "Stocks",
  mutual_fund: "Mutual Funds",
  etf: "ETFs",
  gold: "Gold",
  debt: "Debt",
  cash: "Cash",
  crypto: "Crypto",
};

export const ASSET_CLASS_COLORS: Record<string, string> = {
  equity: "#6366f1",
  mutual_fund: "#10b981",
  etf: "#f59e0b",
  gold: "#eab308",
  debt: "#06b6d4",
  cash: "#94a3b8",
  crypto: "#ec4899",
};

export const BENCHMARKS = {
  nifty50: { symbol: "^NSEI", name: "Nifty 50" },
  sensex: { symbol: "^BSESN", name: "Sensex" },
  midcap: { symbol: "^NSEMDCP50", name: "Nifty Midcap 50" },
} as const;

export const RESEARCH_MODES = [
  { id: "quick", label: "Quick Analysis", agents: 3, desc: "Fast snapshot — key metrics & a verdict." },
  { id: "standard", label: "Standard Research", agents: 5, desc: "Balanced report across the main dimensions." },
  { id: "deep", label: "Deep Research", agents: 8, desc: "Full analyst team, every dimension covered." },
  { id: "institutional", label: "Institutional Report", agents: 9, desc: "Maximum depth, bull/bear/base, high rigor." },
] as const;
export type ResearchMode = (typeof RESEARCH_MODES)[number]["id"];

export const RISK_FREE_RATE = 0.065; // ~India 10Y G-Sec, used in Sharpe etc.
export const EQUITY_EXPECTED_RETURN = 0.12; // long-run nominal assumption for projections

export const COMPLIANCE_DISCLAIMER =
  "FinPilot AI provides educational financial intelligence and research only. It is not investment advice, not a registered investment adviser, and does not execute trades. Always do your own research or consult a SEBI-registered adviser before investing.";
