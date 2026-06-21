/**
 * Seeds a realistic Indian demo user so FinPilot AI is impressive on first run.
 * All price history is generated deterministically offline — no network needed.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DAY = 24 * 3600 * 1000;
const now = new Date("2026-06-21T00:00:00Z");

// Simple seeded PRNG so the demo is stable across reseeds.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(42);

// Standard-normal via Box-Muller (deterministic given the seeded PRNG).
function gauss(): number {
  const u1 = rand() || 1e-9;
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const DAYS = 365;

// Shared MARKET return factor so holdings are correlated with the index (realistic
// beta, volatility and drawdowns). Includes a ~18% drawdown event mid-window.
const MARKET_RETURNS: number[] = (() => {
  const r: number[] = [];
  const drift = 0.15 / 252;
  const vol = 0.008;
  for (let i = 0; i <= DAYS; i++) {
    let shock = gauss() * vol;
    // Engineer a correction around days 150-185 then a recovery.
    if (i >= 150 && i < 170) shock -= 0.010;
    if (i >= 185 && i < 220) shock += 0.009;
    r.push(drift + shock);
  }
  return r;
})();

function pathFromReturns(start: number, returns: number[]) {
  const out: { date: Date; close: number }[] = [];
  let price = start;
  for (let i = 0; i < returns.length; i++) {
    const date = new Date(now.getTime() - (returns.length - 1 - i) * DAY);
    price = Math.max(1, price * (1 + returns[i]));
    out.push({ date, close: Math.round(price * 100) / 100 });
  }
  return out;
}

// Index path from the market factor, optionally levered (midcap is beta>1).
function genIndexHistory(start: number, betaToMarket = 1, extraVol = 0) {
  const rets = MARKET_RETURNS.map((m) => betaToMarket * m + gauss() * extraVol);
  return pathFromReturns(start, rets);
}

// Stock path: return = alpha + beta*market + idiosyncratic noise.
function genStockHistory(start: number, alphaAnnual: number, betaToMarket: number, idioVol: number) {
  const a = alphaAnnual / 252;
  const rets = MARKET_RETURNS.map((m) => a + betaToMarket * m + gauss() * idioVol);
  return pathFromReturns(start, rets);
}

type StockSeed = {
  symbol: string;
  name: string;
  assetClass: string;
  sector: string;
  marketCap: string;
  qty: number;
  avgCost: number;
  start: number; // price ~1y ago
  alpha: number; // annual excess return vs market
  beta: number; // sensitivity to market factor
  idio: number; // idiosyncratic daily vol
};

const STOCKS: StockSeed[] = [
  { symbol: "TCS", name: "Tata Consultancy Services", assetClass: "equity", sector: "Technology", marketCap: "large", qty: 18, avgCost: 3450, start: 3600, alpha: 0.00, beta: 0.85, idio: 0.008 },
  { symbol: "INFY", name: "Infosys", assetClass: "equity", sector: "Technology", marketCap: "large", qty: 30, avgCost: 1480, start: 1520, alpha: -0.02, beta: 0.95, idio: 0.009 },
  { symbol: "RELIANCE", name: "Reliance Industries", assetClass: "equity", sector: "Energy", marketCap: "large", qty: 24, avgCost: 2650, start: 2700, alpha: 0.03, beta: 1.05, idio: 0.009 },
  { symbol: "HDFCBANK", name: "HDFC Bank", assetClass: "equity", sector: "Financials", marketCap: "large", qty: 22, avgCost: 1560, start: 1500, alpha: 0.01, beta: 1.0, idio: 0.008 },
  { symbol: "ICICIBANK", name: "ICICI Bank", assetClass: "equity", sector: "Financials", marketCap: "large", qty: 30, avgCost: 1020, start: 980, alpha: 0.05, beta: 1.1, idio: 0.009 },
  { symbol: "TITAN", name: "Titan Company", assetClass: "equity", sector: "Consumer", marketCap: "large", qty: 8, avgCost: 3380, start: 3300, alpha: -0.04, beta: 0.9, idio: 0.012 },
  { symbol: "DMART", name: "Avenue Supermarts", assetClass: "equity", sector: "Consumer", marketCap: "large", qty: 5, avgCost: 4100, start: 4300, alpha: -0.10, beta: 0.8, idio: 0.013 },
  { symbol: "DIXON", name: "Dixon Technologies", assetClass: "equity", sector: "Technology", marketCap: "mid", qty: 6, avgCost: 12800, start: 11500, alpha: 0.14, beta: 1.35, idio: 0.02 },
  { symbol: "POLYCAB", name: "Polycab India", assetClass: "equity", sector: "Industrials", marketCap: "mid", qty: 7, avgCost: 6200, start: 6000, alpha: 0.06, beta: 1.2, idio: 0.015 },
  { symbol: "KPITTECH", name: "KPIT Technologies", assetClass: "equity", sector: "Technology", marketCap: "mid", qty: 20, avgCost: 1450, start: 1600, alpha: -0.18, beta: 1.3, idio: 0.022 },
  { symbol: "CAPLIPOINT", name: "Caplin Point Labs", assetClass: "equity", sector: "Healthcare", marketCap: "small", qty: 15, avgCost: 1980, start: 1850, alpha: 0.10, beta: 1.15, idio: 0.024 },
];

// Mutual funds — symbol is the AMFI scheme code (used by mfapi.in). Top holdings
// seeded into meta so overlap detection works offline.
type FundSeed = {
  symbol: string;
  name: string;
  sector: string;
  units: number;
  avgNav: number;
  nav: number;
  holdings: string[];
  style: string;
  expense: number;
};
const FUNDS: FundSeed[] = [
  {
    symbol: "122639", name: "Parag Parikh Flexi Cap Fund - Direct Growth", sector: "Diversified",
    units: 1850, avgNav: 62, nav: 79.4, style: "Flexi Cap",
    expense: 0.63, holdings: ["HDFCBANK", "ICICIBANK", "BAJFINANCE", "ITC", "INFOSYS", "POWERGRID", "MARUTI"],
  },
  {
    symbol: "120505", name: "Mirae Asset Large Cap Fund - Direct Growth", sector: "Large Cap",
    units: 1200, avgNav: 88, nav: 104.2, style: "Large Cap",
    expense: 0.54, holdings: ["HDFCBANK", "ICICIBANK", "RELIANCE", "INFOSYS", "TCS", "AXISBANK", "LT"],
  },
  {
    symbol: "118778", name: "Nippon India Small Cap Fund - Direct Growth", sector: "Small Cap",
    units: 900, avgNav: 120, nav: 168.7, style: "Small Cap",
    expense: 0.79, holdings: ["HDFCBANK", "TUBEINVEST", "MULTICOMM", "KIRLOSKAR", "APARINDS", "CAPLIPOINT"],
  },
  {
    symbol: "119598", name: "UTI Nifty 50 Index Fund - Direct Growth", sector: "Index",
    units: 1400, avgNav: 110, nav: 132.5, style: "Index",
    expense: 0.20, holdings: ["RELIANCE", "HDFCBANK", "ICICIBANK", "INFOSYS", "TCS", "ITC", "LT", "BHARTIARTL"],
  },
];

async function main() {
  console.log("🌱 Resetting demo data...");
  // Wipe in FK-safe order.
  await prisma.chatMessage.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.priceSnapshot.deleteMany();
  await prisma.instrument.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.sIP.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.holding.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Aarav Mehta",
      email: "demo@finpilot.ai",
      monthlyIncome: 180000,
      riskProfile: "balanced",
      preferences: JSON.stringify({ currency: "INR", country: "IN" }),
    },
  });

  const broker = await prisma.account.create({
    data: { userId: user.id, name: "Groww", type: "broker", provider: "groww", balance: 24000 },
  });
  const bank = await prisma.account.create({
    data: { userId: user.id, name: "HDFC Savings", type: "bank", provider: "hdfc", balance: 320000 },
  });

  // ---- Holdings + price history (stocks) ----
  for (const s of STOCKS) {
    const hist = genStockHistory(s.start, s.alpha, s.beta, s.idio);
    const current = hist[hist.length - 1].close;
    await prisma.holding.create({
      data: {
        userId: user.id, accountId: broker.id, symbol: s.symbol, name: s.name,
        assetClass: s.assetClass, sector: s.sector, marketCap: s.marketCap,
        quantity: s.qty, avgCost: s.avgCost, currentPrice: current,
      },
    });
    const inst = await prisma.instrument.create({
      data: { symbol: s.symbol, name: s.name, type: "stock", sector: s.sector, meta: JSON.stringify({ marketCap: s.marketCap }) },
    });
    // Store weekly snapshots to keep DB light.
    await prisma.priceSnapshot.createMany({
      data: hist.filter((_, i) => i % 5 === 0).map((p) => ({ instrumentId: inst.id, date: p.date, close: p.close })),
    });
  }

  // ---- Mutual fund holdings ----
  for (const f of FUNDS) {
    await prisma.holding.create({
      data: {
        userId: user.id, accountId: broker.id, symbol: f.symbol, name: f.name,
        assetClass: "mutual_fund", sector: f.sector, marketCap: "na",
        quantity: f.units, avgCost: f.avgNav, currentPrice: f.nav,
      },
    });
    await prisma.instrument.create({
      data: {
        symbol: f.symbol, name: f.name, type: "mf", sector: f.sector,
        meta: JSON.stringify({ holdings: f.holdings, style: f.style, expense: f.expense, nav: f.nav }),
      },
    });
  }

  // Gold ETF for asset diversification.
  await prisma.holding.create({
    data: {
      userId: user.id, accountId: broker.id, symbol: "GOLDBEES", name: "Nippon India Gold ETF",
      assetClass: "etf", sector: "Other", marketCap: "na", quantity: 200, avgCost: 58, currentPrice: 71.2,
    },
  });

  // ---- Benchmark indices (Nifty/Sensex = the market factor; midcap is levered) ----
  const benchmarks = [
    { symbol: "^NSEI", name: "Nifty 50", start: 22800, beta: 1.0, extra: 0 },
    { symbol: "^BSESN", name: "Sensex", start: 75000, beta: 1.0, extra: 0.001 },
    { symbol: "^NSEMDCP50", name: "Nifty Midcap 50", start: 14200, beta: 1.3, extra: 0.004 },
  ];
  for (const b of benchmarks) {
    const inst = await prisma.instrument.create({
      data: { symbol: b.symbol, name: b.name, type: "index", sector: "Diversified", meta: "{}" },
    });
    const hist = genIndexHistory(b.start, b.beta, b.extra);
    await prisma.priceSnapshot.createMany({
      data: hist.filter((_, i) => i % 5 === 0).map((p) => ({ instrumentId: inst.id, date: p.date, close: p.close })),
    });
  }

  // ---- Goals ----
  const goals = await Promise.all([
    prisma.goal.create({ data: { userId: user.id, name: "Emergency Fund", type: "emergency", targetAmount: 720000, currentAmount: 620000, targetDate: new Date(now.getTime() + 240 * DAY), monthlyContribution: 12000, priority: 1 } }),
    prisma.goal.create({ data: { userId: user.id, name: "House Down Payment", type: "house", targetAmount: 4000000, currentAmount: 1250000, targetDate: new Date(now.getTime() + 4 * 365 * DAY), monthlyContribution: 35000, priority: 1 } }),
    prisma.goal.create({ data: { userId: user.id, name: "Retirement Corpus", type: "retirement", targetAmount: 50000000, currentAmount: 2100000, targetDate: new Date(now.getTime() + 28 * 365 * DAY), monthlyContribution: 30000, priority: 2 } }),
  ]);

  // ---- SIPs ----
  await prisma.sIP.createMany({
    data: [
      { userId: user.id, name: "Parag Parikh Flexi Cap", symbol: "122639", amount: 15000, frequency: "monthly", startDate: new Date("2022-04-05"), goalId: goals[2].id },
      { userId: user.id, name: "Mirae Asset Large Cap", symbol: "120505", amount: 10000, frequency: "monthly", startDate: new Date("2023-01-05"), goalId: goals[1].id },
      { userId: user.id, name: "Nippon India Small Cap", symbol: "118778", amount: 8000, frequency: "monthly", startDate: new Date("2023-06-05"), goalId: goals[2].id },
      { userId: user.id, name: "UTI Nifty 50 Index", symbol: "119598", amount: 12000, frequency: "monthly", startDate: new Date("2022-09-05"), goalId: goals[1].id },
    ],
  });

  // ---- Transactions: ~8 months of categorized cashflow ----
  const months = 8;
  const txns: {
    date: Date; direction: string; type: string; amount: number; category: string; merchant: string; note?: string; accountId: string;
  }[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const infl = 1 + (months - 1 - m) * 0.012; // lifestyle inflation creep
    const d = (day: number) => new Date(base.getFullYear(), base.getMonth(), day);
    // Salary
    txns.push({ date: d(1), direction: "in", type: "salary", amount: 180000, category: "Other", merchant: "Acme Corp Payroll", accountId: bank.id });
    // Rent
    txns.push({ date: d(3), direction: "out", type: "expense", amount: 38000, category: "Housing", merchant: "Landlord Rent", accountId: bank.id });
    // SIP debits
    txns.push({ date: d(5), direction: "out", type: "sip", amount: 45000, category: "Other", merchant: "Groww SIP Auto-debit", accountId: bank.id });
    // Food (several)
    for (let i = 0; i < 4; i++) txns.push({ date: d(4 + i * 6), direction: "out", type: "expense", amount: Math.round((2200 + rand() * 1800) * infl), category: "Food", merchant: i % 2 ? "Swiggy" : "BigBasket", accountId: bank.id });
    // Transport
    txns.push({ date: d(8), direction: "out", type: "expense", amount: Math.round((3200 + rand() * 900) * infl), category: "Transportation", merchant: "Uber / Fuel", accountId: bank.id });
    // Utilities
    txns.push({ date: d(12), direction: "out", type: "expense", amount: Math.round(2600 + rand() * 700), category: "Utilities", merchant: "Electricity + Broadband", accountId: bank.id });
    // Subscriptions
    txns.push({ date: d(14), direction: "out", type: "expense", amount: 1497, category: "Subscriptions", merchant: "Netflix + Spotify + Prime", accountId: bank.id });
    // Shopping (rising)
    txns.push({ date: d(18), direction: "out", type: "expense", amount: Math.round((6500 + rand() * 4000) * infl * infl), category: "Shopping", merchant: "Amazon / Myntra", accountId: bank.id });
    // Healthcare occasional
    if (m % 3 === 0) txns.push({ date: d(20), direction: "out", type: "expense", amount: Math.round(2400 + rand() * 1500), category: "Healthcare", merchant: "Apollo Pharmacy", accountId: bank.id });
    // Entertainment
    txns.push({ date: d(22), direction: "out", type: "expense", amount: Math.round(1800 + rand() * 1200), category: "Entertainment", merchant: "BookMyShow", accountId: bank.id });
    // Education occasional
    if (m === 4) txns.push({ date: d(16), direction: "out", type: "expense", amount: 12999, category: "Education", merchant: "Coursera Plus", accountId: bank.id });
    // Dividend in
    if (m % 2 === 0) txns.push({ date: d(25), direction: "in", type: "dividend", amount: Math.round(1500 + rand() * 2500), category: "Other", merchant: "Equity Dividend", accountId: broker.id });
  }
  // Anomaly: big one-off shopping spike last month.
  txns.push({ date: new Date(now.getFullYear(), now.getMonth(), 15), direction: "out", type: "expense", amount: 84000, category: "Shopping", merchant: "iPhone 16 Pro", note: "One-off", accountId: bank.id });

  await prisma.transaction.createMany({ data: txns.map((t) => ({ ...t, userId: user.id })) });

  // ---- Watchlist ----
  await prisma.watchlist.createMany({
    data: [
      { userId: user.id, symbol: "BHARTIARTL", name: "Bharti Airtel", type: "stock" },
      { userId: user.id, symbol: "TATAMOTORS", name: "Tata Motors", type: "stock" },
      { userId: user.id, symbol: "118778", name: "Nippon India Small Cap", type: "mf" },
    ],
  });

  // ---- AI memory seeds (personalization) ----
  await prisma.memory.createMany({
    data: [
      { userId: user.id, key: "risk_profile", value: "Balanced investor, comfortable with equity but dislikes large drawdowns.", source: "onboarding" },
      { userId: user.id, key: "preference", value: "Prefers index funds and large-caps; wary of small-cap concentration.", source: "onboarding" },
      { userId: user.id, key: "goal_focus", value: "Top priority is buying a house in ~4 years.", source: "onboarding" },
    ],
  });

  const holdingsCount = STOCKS.length + FUNDS.length + 1;
  console.log(`✅ Seeded demo user "${user.name}" — ${holdingsCount} holdings, ${txns.length} transactions, ${goals.length} goals, 4 SIPs.`);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
