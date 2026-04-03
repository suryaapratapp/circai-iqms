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
    <SurfaceCard className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="rounded-full bg-slate-100 p-4 text-slate-500">
        <SearchX className="h-7 w-7" />
      </div>
      <div>
        <p className="font-heading text-lg font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-slate-600">{description}</p>
      </div>
    </SurfaceCard>
  );
}
