"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { classifyMerchant } from "@/lib/spending-client";
import { formatINR } from "@/lib/utils";
import { Upload, FileText, Check, Loader2, Link2 } from "lucide-react";

type Row = { date: string; description: string; amount: number; category: string };

const SAMPLE = `date,description,amount
2026-06-01,Acme Corp Salary,180000
2026-06-03,Landlord Rent,-38000
2026-06-06,Swiggy,-2400
2026-06-09,Uber,-1800
2026-06-12,Amazon Shopping,-7200
2026-06-15,Netflix Spotify,-1497`;

export function ImportClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState<"idle" | "importing" | "done">("idle");
  const [imported, setImported] = useState(0);

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/);
    const header = lines[0].toLowerCase().split(",").map((s) => s.trim());
    const di = header.indexOf("date");
    const desci = header.findIndex((h) => h.includes("desc") || h.includes("merchant") || h.includes("narration"));
    const ai = header.findIndex((h) => h.includes("amount"));
    const parsed: Row[] = [];
    for (const line of lines.slice(1)) {
      const cols = line.split(",");
      const date = cols[di >= 0 ? di : 0]?.trim();
      const description = cols[desci >= 0 ? desci : 1]?.trim() ?? "";
      const amount = parseFloat(cols[ai >= 0 ? ai : 2]?.replace(/[^0-9.-]/g, "") ?? "0");
      if (!date || !amount) continue;
      parsed.push({ date, description, amount, category: amount < 0 ? classifyMerchant(description) : "Income" });
    }
    setRows(parsed);
    setStatus("idle");
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseCsv(String(reader.result));
    reader.readAsText(file);
  }

  async function doImport() {
    setStatus("importing");
    const res = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setImported(data.imported ?? 0);
    setStatus("done");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--primary)]" /> Upload Transactions (CSV)
          </CardTitle>
          <p className="text-xs text-[var(--muted)]">Bank / UPI / card statement with columns: date, description, amount (negative = expense).</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              <Upload className="h-4 w-4" /> Choose CSV
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
            </label>
            <Button variant="outline" size="sm" onClick={() => parseCsv(SAMPLE)}>
              <FileText className="h-4 w-4" /> Load sample
            </Button>
          </div>

          {rows.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{rows.length} rows parsed & auto-categorized</span>
                <Button size="sm" onClick={doImport} disabled={status === "importing"}>
                  {status === "importing" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Import {rows.length}
                </Button>
              </div>
              <div className="max-h-72 overflow-y-auto rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--surface-2)] text-left text-xs text-[var(--muted)]">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i} className="border-t border-[var(--border)]">
                        <td className="px-3 py-2 text-[var(--muted)]">{r.date}</td>
                        <td className="px-3 py-2">{r.description}</td>
                        <td className="px-3 py-2"><Badge variant="outline">{r.category}</Badge></td>
                        <td className={`num px-3 py-2 text-right font-medium ${r.amount < 0 ? "text-[var(--negative)]" : "text-[var(--positive)]"}`}>{formatINR(r.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {status === "done" && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Imported {imported} transactions. Your spending & savings intelligence has been updated.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[var(--primary)]" /> Connect a Broker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: "Groww (MCP)", note: "Portfolio, holdings & orders", ready: true },
            { name: "Zerodha Kite", note: "Holdings & positions", ready: false },
            { name: "AngelOne", note: "Holdings", ready: false },
            { name: "Upstox", note: "Holdings", ready: false },
          ].map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2.5">
              <div>
                <div className="text-sm font-medium">{b.name}</div>
                <div className="text-xs text-[var(--muted)]">{b.note}</div>
              </div>
              <Button variant="outline" size="sm" disabled>
                {b.ready ? "Connect" : "Soon"}
              </Button>
            </div>
          ))}
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Broker connections require your credentials and run through a secure adapter. FinPilot is read-only — it never places trades. The CSV/manual path always works without any broker.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
