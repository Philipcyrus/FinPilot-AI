import { Suspense } from "react";
import { ResearchClient } from "@/components/research/ResearchClient";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

export default function ResearchPage() {
  return (
    <div className="animate-in">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <ResearchClient />
      </Suspense>
    </div>
  );
}
