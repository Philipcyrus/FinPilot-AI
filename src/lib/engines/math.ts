// Pure financial math helpers — the deterministic backbone of FinPilot.

export function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function stdev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

/** Simple period returns from a price series. */
export function returnsFromPrices(prices: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    if (prices[i - 1] > 0) r.push(prices[i] / prices[i - 1] - 1);
  }
  return r;
}

/** Annualized volatility from a series of daily/period returns. */
export function annualizedVol(returns: number[], periodsPerYear = 252): number {
  return stdev(returns) * Math.sqrt(periodsPerYear);
}

/** Maximum drawdown (as a positive fraction) from a price series. */
export function maxDrawdown(prices: number[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const p of prices) {
    if (p > peak) peak = p;
    if (peak > 0) maxDD = Math.max(maxDD, (peak - p) / peak);
  }
  return maxDD;
}

/** CAGR given start value, end value and number of years. */
export function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0;
  return (end / start) ** (1 / years) - 1;
}

export type CashFlow = { date: Date; amount: number }; // negative = invested, positive = received

/** XIRR via Newton-Raphson with bisection fallback. Returns annualized rate. */
export function xirr(flows: CashFlow[], guess = 0.1): number {
  if (flows.length < 2) return 0;
  const t0 = flows[0].date.getTime();
  const years = (f: CashFlow) => (f.date.getTime() - t0) / (365 * 24 * 3600 * 1000);
  const npv = (rate: number) => flows.reduce((s, f) => s + f.amount / (1 + rate) ** years(f), 0);
  const dnpv = (rate: number) =>
    flows.reduce((s, f) => {
      const y = years(f);
      return s - (y * f.amount) / (1 + rate) ** (y + 1);
    }, 0);

  let rate = guess;
  for (let i = 0; i < 50; i++) {
    const f = npv(rate);
    const df = dnpv(rate);
    if (Math.abs(df) < 1e-10) break;
    const next = rate - f / df;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }
  // Bisection fallback over a sane range.
  let lo = -0.95;
  let hi = 5;
  let flo = npv(lo);
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fmid = npv(mid);
    if (Math.abs(fmid) < 1e-6) return mid;
    if (flo * fmid < 0) hi = mid;
    else {
      lo = mid;
      flo = fmid;
    }
  }
  return rate;
}

/** Beta of an asset's returns vs benchmark returns. */
export function beta(asset: number[], benchmark: number[]): number {
  const n = Math.min(asset.length, benchmark.length);
  if (n < 2) return 1;
  const a = asset.slice(-n);
  const b = benchmark.slice(-n);
  const ma = mean(a);
  const mb = mean(b);
  let cov = 0;
  let varb = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - ma) * (b[i] - mb);
    varb += (b[i] - mb) ** 2;
  }
  if (varb === 0) return 1;
  return cov / varb;
}

/** Herfindahl-Hirschman Index (0-1) for concentration from weights (fractions). */
export function hhi(weights: number[]): number {
  return weights.reduce((s, w) => s + w * w, 0);
}

/** Future value of a SIP: monthly contribution compounded at annual rate. */
export function sipFutureValue(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return monthly * n;
  return monthly * ((((1 + r) ** n - 1) / r) * (1 + r));
}

/** Monthly SIP required to reach a target future value. */
export function requiredSip(target: number, annualRate: number, years: number, current = 0): number {
  const r = annualRate / 12;
  const n = years * 12;
  const fvOfCurrent = current * (1 + annualRate) ** years;
  const need = Math.max(0, target - fvOfCurrent);
  if (n <= 0) return need;
  if (r === 0) return need / n;
  return need / ((((1 + r) ** n - 1) / r) * (1 + r));
}

/** Lightweight Monte Carlo success probability for a goal. */
export function goalSuccessProbability(
  current: number,
  monthly: number,
  years: number,
  target: number,
  expectedReturn = 0.11,
  vol = 0.15,
  trials = 600,
): number {
  if (years <= 0) return current >= target ? 1 : 0;
  let success = 0;
  const months = Math.round(years * 12);
  const mr = expectedReturn / 12;
  const mv = vol / Math.sqrt(12);
  for (let t = 0; t < trials; t++) {
    let bal = current;
    for (let mo = 0; mo < months; mo++) {
      // Box-Muller normal draw.
      const u1 = Math.random() || 1e-9;
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const monthlyReturn = mr + mv * z;
      bal = bal * (1 + monthlyReturn) + monthly;
    }
    if (bal >= target) success++;
  }
  return success / trials;
}

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
