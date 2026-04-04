import { SearchX } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <SurfaceCard className="flex flex-col items-center gap-4 rounded-[32px] px-6 py-12 text-center">
      <div className="rounded-[22px] bg-blue-50 p-4 text-teal">
        <SearchX className="h-7 w-7" />
      </div>
      <div>
        <p className="font-heading text-xl font-semibold text-ink">{title}</p>
        <p className="mt-2 max-w-md text-sm text-slate-600">{description}</p>
      </div>
    </SurfaceCard>
  );
}
