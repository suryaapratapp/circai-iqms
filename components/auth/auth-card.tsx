import Link from "next/link";
import { SurfaceCard } from "@/components/ui/surface-card";
import { BrandLockup } from "@/components/layout/brand-lockup";

export function AuthCard({
  title,
  description,
  footer,
  children
}: {
  title: string;
  description: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <SurfaceCard className="w-full max-w-xl rounded-[36px] px-6 py-7 md:px-8">
      <div className="mb-6">
        <Link className="inline-block" href="/">
          <BrandLockup size="lg" />
        </Link>
        <h1 className="mt-5 font-heading text-3xl font-bold text-ink">{title}</h1>
        {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
      </div>
      {children}
      {footer ? <div className="mt-6 border-t border-slate-200 pt-5">{footer}</div> : null}
    </SurfaceCard>
  );
}
