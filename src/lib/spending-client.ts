import { MERCHANT_CATEGORY_RULES, type SpendingCategory } from "@/lib/constants";

/** Client-safe rule-based merchant categorizer (mirrors the engine logic). */
export function classifyMerchant(text: string): SpendingCategory {
  for (const [re, cat] of MERCHANT_CATEGORY_RULES) if (re.test(text)) return cat;
  return "Other";
}
