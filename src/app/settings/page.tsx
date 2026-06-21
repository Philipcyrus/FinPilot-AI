import { getLlmConfig } from "@/lib/ai/llm";
import { getActiveUser } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Cpu, Database, ShieldCheck, Check, X } from "lucide-react";

export const dynamic = "force-dynamic";

const PROVIDERS = [
  { id: "openrouter", name: "OpenRouter", env: "OPENROUTER_API_KEY", note: "Free models like Llama 3.3 70B. Get a free key at openrouter.ai." },
  { id: "gemini", name: "Google Gemini", env: "GEMINI_API_KEY", note: "Generous free tier (Gemini 2.0 Flash). aistudio.google.com." },
  { id: "groq", name: "Groq", env: "GROQ_API_KEY", note: "Very fast free inference (Llama). console.groq.com." },
  { id: "ollama", name: "Ollama (local)", env: "OLLAMA_MODEL", note: "Fully offline & free. Run `ollama serve` locally." },
];

const DATA_PROVIDERS = [
  { name: "mfapi.in", use: "Mutual fund NAV & history", status: "Free · no key" },
  { name: "Yahoo Finance", use: "Stock & index quotes/history", status: "Free · no key" },
  { name: "Google News RSS", use: "News intelligence", status: "Free · no key" },
  { name: "Groww MCP", use: "Live broker portfolio", status: "Needs credentials" },
];

export default async function SettingsPage() {
  const cfg = getLlmConfig();
  const user = await getActiveUser();
  const active = cfg.provider !== "none";

  return (
    <div className="space-y-6 animate-in">
      <PageHeader title="Settings" subtitle="Configure AI models, data sources and your profile." icon={<SettingsIcon className="h-5 w-5" />} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[var(--primary)]" /> AI Engine
          </CardTitle>
          <p className="text-xs text-[var(--muted)]">
            Active provider: <span className="font-semibold text-[var(--foreground)]">{cfg.label}</span>
            {active && <span className="text-[var(--muted)]"> · model {cfg.model}</span>}
          </p>
        </CardHeader>
        <CardContent>
          {!active && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">
              No LLM key detected — research & chat run on the <strong>deterministic engine</strong> (still fully functional). Add any one free key below to a <code className="rounded bg-[var(--surface-2)] px-1">.env.local</code> file and restart to unlock conversational AI.
            </div>
          )}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PROVIDERS.map((p) => {
              const enabled = cfg.provider === p.id;
              return (
                <div key={p.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{p.name}</span>
                    {enabled ? (
                      <Badge variant="positive"><Check className="h-3 w-3" /> Active</Badge>
                    ) : (
                      <Badge variant="outline"><X className="h-3 w-3" /> Off</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{p.note}</p>
                  <code className="mt-2 block rounded bg-[var(--surface-2)] px-2 py-1 text-[11px]">{p.env}=your_key</code>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--primary)]" /> Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {DATA_PROVIDERS.map((d) => (
              <div key={d.name} className="flex items-center justify-between rounded-lg bg-[var(--surface-2)]/40 px-3 py-2 text-sm">
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="text-xs text-[var(--muted)]">{d.use}</div>
                </div>
                <Badge variant={d.status.includes("Free") ? "positive" : "warning"}>{d.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--primary)]" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Name" value={user?.name ?? "—"} />
            <Row label="Risk profile" value={user?.riskProfile ?? "balanced"} />
            <Row label="Monthly income" value={`₹${(user?.monthlyIncome ?? 0).toLocaleString("en-IN")}`} />
            <p className="pt-2 text-xs text-[var(--muted)]">Reset demo data anytime with <code className="rounded bg-[var(--surface-2)] px-1">npm run db:reset</code>.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] py-2 last:border-0">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
