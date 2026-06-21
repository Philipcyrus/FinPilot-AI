import "server-only";
import { cache } from "react";
import { loadFinancialPicture } from "@/lib/data";
import { computeDashboard, type Dashboard } from "@/lib/engines";

/**
 * Loads the financial picture and runs the full engine suite.
 * `cache()` dedupes the work within a single request (across RSC tree).
 */
export const getDashboard = cache(async (): Promise<Dashboard> => {
  const picture = await loadFinancialPicture();
  // Emergency-fund balance = the Emergency Fund goal's current amount (liquid reserve).
  const ef = picture.goals.find((g) => g.type === "emergency")?.currentAmount ?? 0;
  return computeDashboard(picture, ef);
});
