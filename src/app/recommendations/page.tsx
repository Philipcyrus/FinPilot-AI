import { getDashboard } from "@/lib/dashboard";
import { PageHeader, AiBadge } from "@/components/common";
import { RecommendationCard } from "@/components/RecommendationCard";
import { EmptyState } from "@/components/common";
import { Lightbulb } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RecommendationsPage() {
  const d = await getDashboard();
  return (
    <div className="space-y-6 animate-in">
      <PageHeader
        title="Personalized Recommendations"
        subtitle="Evidence-backed actions, ranked by impact — each with alternatives and confidence."
        icon={<Lightbulb className="h-5 w-5" />}
        actions={<AiBadge label="Adapts to you" />}
      />
      {d.recommendations.length === 0 ? (
        <EmptyState title="You're in great shape" body="No pressing recommendations right now. Check back as your data evolves." icon={<Lightbulb className="h-5 w-5" />} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {d.recommendations.map((r) => (
            <RecommendationCard key={r.id} rec={r} />
          ))}
        </div>
      )}
    </div>
  );
}
