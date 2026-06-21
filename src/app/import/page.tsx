import { PageHeader } from "@/components/common";
import { ImportClient } from "@/components/import/ImportClient";
import { Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Import Data"
        subtitle="Add transactions via CSV or connect a broker. FinPilot stays useful with partial data."
        icon={<Upload className="h-5 w-5" />}
      />
      <ImportClient />
    </div>
  );
}
