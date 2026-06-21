export type DataSource = "live" | "cached" | "demo";

export type Quote = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
  currency: string;
  source: DataSource;
  history?: { date: string; close: number }[];
  meta?: Record<string, unknown>;
};

export type FundInfo = {
  schemeCode: string;
  name: string;
  category: string;
  nav: number;
  navDate: string;
  returns: { period: string; value: number }[];
  source: DataSource;
  history?: { date: string; nav: number }[];
};

export type NewsItem = {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  impact?: "positive" | "neutral" | "negative";
  summary?: string;
};
