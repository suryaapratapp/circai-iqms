import { cn } from "@/lib/utils/cn";

export function SurfaceCard({
  className,
  children
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("glass-panel rounded-[30px] p-5", className)}>{children}</div>
  );
}
