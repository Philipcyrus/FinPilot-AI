import type { FinancialPicture } from "@/lib/types";
import { analyzeGoal } from "./goals";

export type ScenarioId =
  | "market_crash"
  | "sector_crash_it"
  | "rate_hike"
  | "inflation_spike"
  | "income_loss"
  | "income_raise"
  | "major_purchase";

export type ScenarioInput = {
  id: ScenarioId;
  magnitude: number; // 0-100 slider, interpreted per scenario
};

export type ScenarioResult = {
  title: string;
  assumption: string;
  portfolioBefore: number;
  portfolioAfter: number;
  portfolioImpactPct: number;
  cashflowImpact: string;
  goalImpact: { goal: string; before: number; after: number; note: string }[];
  resilience: "strong" | "moderate" | "fragile";
  narrative: string;
};

const SECTOR_SENSITIVITY: Record<string, number> = {
  Technology: 1.2,
  Financials: 1.1,
  Energy: 0.9,
  Consumer: 0.85,
  Healthcare: 0.7,
  Industrials: 1.0,
  Other: 0.8,
};

export function simulateScenario(p: FinancialPicture, input: ScenarioInput): ScenarioResult {
  const totalValue = p.holdings.reduce((s, h) => s + h.value, 0);
  const equityValue = p.holdings.filter((h) => h.assetClass !== "cash" && h.assetClass !== "gold" && h.assetClass !== "debt").reduce((s, h) => s + h.value, 0);

  let after = totalValue;
  let title = "";
  let assumption = "";
  let cashflowImpact = "No direct cashflow change.";
  const goalImpact: ScenarioResult["goalImpact"] = [];
  const drop = input.magnitude / 100;

  switch (input.id) {
    case "market_crash": {
      title = `Market crash −${input.magnitude}%`;
      assumption = `Broad equity markets fall ${input.magnitude}%; defensive assets (gold/debt) hold up better.`;
      let impacted = 0;
      for (const h of p.holdings) {
        const factor = h.assetClass === "gold" ? -0.3 : h.assetClass === "debt" || h.assetClass === "cash" ? 0 : 1;
        impacted += h.value * (1 - drop * factor);
      }
      after = impacted;
      break;
    }
    case "sector_crash_it": {
      title = `IT / Technology sector crash −${input.magnitude}%`;
      assumption = `Technology names fall ${input.magnitude}%; rest of portfolio steady.`;
      let impacted = 0;
      for (const h of p.holdings) impacted += h.sector === "Technology" ? h.value * (1 - drop) : h.value;
      after = impacted;
      break;
    }
    case "rate_hike": {
      title = `Interest rates +${(input.magnitude / 50).toFixed(1)}%`;
      assumption = `Rate hikes pressure rate-sensitive sectors (financials, real estate) and debt prices.`;
      let impacted = 0;
      for (const h of p.holdings) {
        const sens = SECTOR_SENSITIVITY[h.sector] ?? 0.8;
        const eq = h.assetClass === "debt" ? 1.5 : sens;
        impacted += h.value * (1 - (drop * 0.4) * eq);
      }
      after = impacted;
      cashflowImpact = "Any floating-rate EMIs would rise; fixed deposits earn more.";
      break;
    }
    case "inflation_spike": {
      title = `Inflation spike +${(input.magnitude / 20).toFixed(1)}%`;
      assumption = `Higher inflation raises living costs and compresses real returns; gold benefits.`;
      after = totalValue + p.holdings.filter((h) => h.assetClass === "gold").reduce((s, h) => s + h.value * drop * 0.5, 0) - equityValue * drop * 0.15;
      cashflowImpact = `Monthly expenses rise ~${(input.magnitude / 20).toFixed(1)}%, reducing your savings surplus.`;
      break;
    }
    case "income_loss": {
      title = `Loss of primary income for ${Math.round(input.magnitude / 100 * 12)} months`;
      assumption = `Salary stops; you rely on emergency fund and may pause SIPs.`;
      after = totalValue;
      cashflowImpact = `You'd draw down savings to cover expenses for ${Math.round(input.magnitude / 100 * 12)} months.`;
      break;
    }
    case "income_raise": {
      title = `Income increase +${input.magnitude}%`;
      assumption = `A raise lets you invest more each month, compounding faster.`;
      after = totalValue;
      cashflowImpact = `Extra monthly surplus could lift SIPs and shorten goal timelines.`;
      break;
    }
    case "major_purchase": {
      title = `Major purchase: ₹${(input.magnitude * 50000).toLocaleString("en-IN")}`;
      assumption = `A large one-off outflow is funded partly by redeeming investments.`;
      after = totalValue - input.magnitude * 50000 * 0.5;
      cashflowImpact = `Redeeming investments now locks in current gains/losses and reduces compounding base.`;
      break;
    }
  }

  const impactPct = totalValue > 0 ? ((after - totalValue) / totalValue) * 100 : 0;

  // Goal impact: re-run goal projection with reduced current amount proportional to portfolio hit.
  const hitRatio = totalValue > 0 ? after / totalValue : 1;
  for (const g of p.goals.slice(0, 3)) {
    const base = analyzeGoal(g);
    const stressed = analyzeGoal({ ...g, currentAmount: g.currentAmount * (g.type === "emergency" ? 1 : hitRatio) });
    goalImpact.push({
      goal: g.name,
      before: Math.round(base.successProbability * 100),
      after: Math.round(stressed.successProbability * 100),
      note: stressed.successProbability < base.successProbability - 0.1 ? "Notably harder to reach" : "Largely resilient",
    });
  }

  const resilience: ScenarioResult["resilience"] = impactPct > -10 ? "strong" : impactPct > -22 ? "moderate" : "fragile";
  const narrative =
    input.id === "income_loss"
      ? `Your emergency fund determines survival here. With your current buffer you can sustain essential expenses for several months without selling investments — the key defence in this scenario.`
      : input.id === "income_raise"
        ? `Rather than lifestyle inflation, routing a raise into SIPs is the highest-leverage move — even a modest step-up compounds meaningfully over your goal horizons.`
        : `This shock would move your portfolio by ${impactPct.toFixed(1)}%. Your ${resilience === "strong" ? "diversification cushions the blow" : resilience === "moderate" ? "mix absorbs part of the hit but concentration shows" : "concentration amplifies the damage"}. Goals with longer horizons recover; near-term goals are most exposed.`;

  return {
    title,
    assumption,
    portfolioBefore: totalValue,
    portfolioAfter: Math.round(after),
    portfolioImpactPct: impactPct,
    cashflowImpact,
    goalImpact,
    resilience,
    narrative,
  };
}

export const SCENARIO_PRESETS: { id: ScenarioId; label: string; defaultMag: number; unit: string }[] = [
  { id: "market_crash", label: "Market Crash", defaultMag: 30, unit: "% drop" },
  { id: "sector_crash_it", label: "IT Sector Crash", defaultMag: 35, unit: "% drop" },
  { id: "rate_hike", label: "Interest Rate Hike", defaultMag: 50, unit: "bps×" },
  { id: "inflation_spike", label: "Inflation Spike", defaultMag: 40, unit: "intensity" },
  { id: "income_loss", label: "Job Loss", defaultMag: 50, unit: "duration" },
  { id: "income_raise", label: "Salary Raise", defaultMag: 20, unit: "% raise" },
  { id: "major_purchase", label: "Major Purchase", defaultMag: 20, unit: "₹50k units" },
];
