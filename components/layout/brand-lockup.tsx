import { appConfig } from "@/lib/config/app";
import { cn } from "@/lib/utils/cn";

export function BrandLockup({
  size = "md",
  className
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span
        className={cn(
          "font-heading font-bold tracking-[-0.03em] text-ink",
          size === "sm" && "text-xl",
          size === "md" && "text-[1.75rem]",
          size === "lg" && "text-[2.35rem] leading-none"
        )}
      >
        {appConfig.name}
      </span>
      <span
        className={cn(
          "font-medium tracking-[0.16em] text-slate-500",
          size === "sm" && "mt-0.5 text-[10px]",
          size === "md" && "mt-1 text-[11px]",
          size === "lg" && "mt-2 text-[11px]"
        )}
      >
        {appConfig.brandLine}
      </span>
    </div>
  );
}
