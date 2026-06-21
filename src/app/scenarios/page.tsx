import { PageHeader } from "@/components/common";
import { ScenarioClient } from "@/components/scenarios/ScenarioClient";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ScenariosPage() {
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Scenario Intelligence"
        subtitle="Stress-test your finances against market crashes, rate hikes, income shocks and more."
        icon={<FlaskConical className="h-5 w-5" />}
      />
      <ScenarioClient />
    </div>
  );
}
