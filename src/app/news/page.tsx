import { PageHeader } from "@/components/common";
import { NewsClient } from "@/components/news/NewsClient";
import { Newspaper } from "lucide-react";

export const dynamic = "force-dynamic";

export default function NewsPage() {
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="News Intelligence"
        subtitle="Live market news, auto-classified by likely impact — positive, neutral or negative."
        icon={<Newspaper className="h-5 w-5" />}
      />
      <NewsClient />
    </div>
  );
}
